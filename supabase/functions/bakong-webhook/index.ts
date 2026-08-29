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

    if (!verified) {
      console.warn("Invalid webhook signature.");
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

      // Send payment confirmation email via Resend
      try {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
          dbTx.user_id,
        );
        const to = userData?.user?.email ?? null;
        const origin = Deno.env.get("SITE_URL") || "";

        let itemName = "Your purchase";
        let cta = origin ? `${origin}/dashboard` : "";
        if (dbTx.course_id) {
          const { data: course } = await supabaseAdmin
            .from("courses")
            .select("title")
            .eq("course_id", dbTx.course_id)
            .single();
          itemName = course?.title || "Course enrollment";
        } else if (dbTx.plan_id && dbTx.subscription_plans) {
          itemName = `${dbTx.subscription_plans.name || "Subscription"} plan`;
        }

        if (resendKey && to) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from:
                Deno.env.get("EMAIL_FROM") ||
                "Archtipsbox <onboarding@resend.dev>",
              to: [to],
              subject: `Payment confirmed - ${itemName}`,
              html: `<div style="font-family:sans-serif;padding:24px;background:#09090b;color:#e4e4e7;border-radius:12px;">
                <h2 style="color:#9ACD32;margin-top:0;">ARCHTIPSBOX</h2>
                <p>Payment confirmed for <strong>${itemName}</strong> ($${Number(dbTx.amount).toFixed(2)} USD).</p>
                <p>Reference: <code>${billNumber}</code></p>
                ${cta ? `<a href="${cta}" style="background:#9ACD32;color:#000;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Open my dashboard</a>` : ""}
              </div>`,
            }),
          });
        }

        // Send Telegram invoice alert
        const telegramToken = Deno.env.get("TELEGRAM_TOKEN");
        const telegramChatId = Deno.env.get("CHAT_ID");

        if (telegramToken && telegramChatId) {
          try {
            let formattedDate = dbTx.completed_at || new Date().toISOString();
            try {
              const dateObj = new Date(formattedDate);
              if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toLocaleString("en-US", {
                  timeZone: "UTC",
                  dateStyle: "medium",
                  timeStyle: "medium"
                }) + " UTC";
              }
            } catch (_) {}

            const invoiceText = `
<b>🧾 NEW PAYMENT INVOICE (Webhook)</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Item:</b> ${itemName}
<b>Bill Number:</b> <code>${billNumber}</code>
<b>Amount:</b> $${Number(dbTx.amount).toFixed(2)} USD
<b>Promo Code:</b> ${dbTx.promo_code ? `<code>${dbTx.promo_code}</code>` : "None"}
<b>Payment Method:</b> ${dbTx.payment_method || "bakong_khqr"} (Webhook)
<b>Completed At:</b> ${formattedDate}
━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Customer Information:</b>
<b>Email:</b> ${to || "N/A"}
<b>User ID:</b> <code>${dbTx.user_id}</code>
<b>Transaction ID:</b> <code>${dbTx.transaction_id || dbTx.id}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Status:</b> ✅ SUCCESSFUL / PAID
`.trim();

            const tgResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                chat_id: telegramChatId,
                text: invoiceText,
                parse_mode: "HTML"
              })
            });

            if (!tgResponse.ok) {
              const tgErrText = await tgResponse.text().catch(() => "");
              console.error(`Warning: Failed to send Telegram message: ${tgResponse.status} - ${tgErrText}`);
            } else {
              console.log(`Telegram invoice notification sent for bill ${billNumber}`);
            }
          } catch (tgErr) {
            console.error("Warning: Error sending Telegram notification:", tgErr);
          }
        }
      } catch (emailErr) {
        console.error(`Warning: Fulfillment notifications failed:`, emailErr);
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
