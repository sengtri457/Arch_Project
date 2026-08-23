// Deno Edge Function for Bakong KHQR Webhook integration
// Serves at: https://<your-project-ref>.supabase.co/functions/v1/bakong-webhook
// Reference: archtipsbox_supabase_setup.md

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Access-Control headers for CORS (useful if payments redirect back to checkout and client verifies local state)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight options request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Get raw request body
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText);

    console.log("Received Bakong webhook payload:", payload);

    // 2. Signature verification
    // Note: Bakong webhooks usually send a signature or hash using a pre-shared secret
    // to verify the payment was actually sent by their server.
    const signature =
      req.headers.get("x-bakong-signature") || payload.signature;
    const webhookSecret = Deno.env.get("BAKONG_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("Missing BAKONG_WEBHOOK_SECRET environment variable.");
      return new Response(
        JSON.stringify({ success: false, message: "Configuration Error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify signature logic (example: HMAC SHA-256 of payload body using secret)
    // Replace this with your specific payment provider's signature algorithm
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const verified = await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBytes(signature),
      encoder.encode(bodyText),
    );

    // For testing/development, you can relax verification checks if webhookSecret is set to 'development'
    if (webhookSecret !== "development" && !verified) {
      console.warn("Invalid webhook signature verified.");
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized Signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 3. Initialize Supabase Admin client with service_role token to bypass RLS policies
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // 4. Extract transaction parameters
    // Format: { transaction_id: "uuid", status: "SUCCESS" | "FAILED", external_ref: "ABA...", amount: 15.00, billNumber: "BILL-001" }
    const { transaction_id, status, external_ref, billNumber, amount } =
      payload;

    if (!billNumber || !status) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required payload parameters",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 5. Query the transaction from public.payment_transactions
    const { data: dbTx, error: selectError } = await supabaseAdmin
      .from("payment_transactions")
      .select("*, subscription_plans(*)")
      .eq("bill_number", billNumber)
      .single();

    if (selectError || !dbTx) {
      console.error(
        `Transaction not found in DB for bill number: ${billNumber}`,
        selectError,
      );
      return new Response(
        JSON.stringify({
          success: false,
          message: "Transaction Record Not Found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Prevent duplicate processing
    if (dbTx.payment_status === "completed") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Transaction already processed",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const isSuccess = status === "SUCCESS" || status === "completed";
    const newStatus = isSuccess ? "completed" : "failed";

    // 6. Update payment transaction status
    const { error: updateTxError } = await supabaseAdmin
      .from("payment_transactions")
      .update({
        payment_status: newStatus,
        external_tx_hash: external_ref || null,
        completed_at: isSuccess ? new Date().toISOString() : null,
      })
      .eq("bill_number", billNumber);

    if (updateTxError) {
      throw new Error(`Failed to update transaction: ${updateTxError.message}`);
    }

    // 7. If payment succeeded, create or update user's subscription record or course enrollment
    if (isSuccess) {
      if (dbTx.plan_id && dbTx.subscription_plans) {
        const planCode = dbTx.subscription_plans.plan_code;
        const billingInterval = dbTx.subscription_plans.billing_interval; // 'monthly' | 'yearly'

        const startDate = new Date();
        const endDate = new Date();
        if (billingInterval === "yearly") {
          endDate.setFullYear(startDate.getFullYear() + 1);
        } else {
          endDate.setMonth(startDate.getMonth() + 1);
        }

        // Upsert user subscription
        const { error: subscriptionError } = await supabaseAdmin
          .from("user_subscriptions")
          .upsert(
            {
              user_id: dbTx.user_id,
              plan_id: dbTx.plan_id,
              status: "active",
              current_period_start: startDate.toISOString(),
              current_period_end: endDate.toISOString(),
              last_transaction_id: dbTx.transaction_id || dbTx.id,
            },
            { onConflict: "user_id" },
          ); // Only allow one active subscription record per user

        if (subscriptionError) {
          throw new Error(
            `Failed to save subscription: ${subscriptionError.message}`,
          );
        }
        console.log(`Successfully activated ${planCode} subscription for user ${dbTx.user_id}`);
      }

      // If direct course purchase, create an enrollment record for the course
      if (dbTx.course_id) {
        const { error: enrollmentError } = await supabaseAdmin
          .from("course_enrollments")
          .upsert({
            student_id: dbTx.user_id,
            course_id: dbTx.course_id,
            status: "active",
            enrolled_at: new Date().toISOString()
          }, { onConflict: "student_id,course_id" })

        if (enrollmentError) {
          throw new Error(`Failed to activate course enrollment: ${enrollmentError.message}`)
        }
        console.log(`Successfully enrolled user ${dbTx.user_id} in course ${dbTx.course_id}`);
      }

      // Also upgrade user's profile role to student/pro logic if applicable
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ role: "student" }) // Pro student
        .eq("id", dbTx.user_id);

      if (profileError) {
        console.error(
          `Warning: Failed to update user profile role: ${profileError.message}`,
        );
      }

      // Increment promo code redemptions count if a promo was applied
      if (dbTx.promo_code) {
        const { data: promoData, error: promoSelectError } = await supabaseAdmin
          .from("promo_codes")
          .select("redemptions_count")
          .eq("code", dbTx.promo_code)
          .single();

        if (!promoSelectError && promoData) {
          const { error: promoUpdateError } = await supabaseAdmin
            .from("promo_codes")
            .update({
              redemptions_count: (promoData.redemptions_count || 0) + 1,
            })
            .eq("code", dbTx.promo_code);

          if (promoUpdateError) {
            console.error(
              `Warning: Failed to increment promo redemptions: ${promoUpdateError.message}`,
            );
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error processing webhook request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Internal Server Error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// Helper: Convert hex string to Uint8Array
function hexToBytes(hex: string | null | undefined): Uint8Array {
  if (!hex) return new Uint8Array(0);
  const bytes = new Uint8Array(hex.length / 2);
  for (let c = 0; c < hex.length; c += 2) {
    bytes[c / 2] = parseInt(hex.substring(c, c + 2), 16);
  }
  return bytes;
}
