"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  CreditCard,
  AlertCircle,
  Lock,
  ArrowLeft,
  Copy,
  ExternalLink,
  Upload,
  Globe,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const courseId = searchParams.get("courseId");
  const planId = searchParams.get("planId");

  // Checkout States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<{
    billNumber: string;
    amount: number;
    khqrPayload: string;
    courseSlug: string;
  } | null>(null);

  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"khqr" | "telegram" | "paypal">(
    "khqr",
  );
  const [isCopied, setIsCopied] = useState(false);

  // PayPal States
  const [paypalTxId, setPaypalTxId] = useState("");
  const [paypalReceiptFile, setPaypalReceiptFile] = useState<File | null>(null);
  const [isSubmittingPaypal, setIsSubmittingPaypal] = useState(false);
  const [paypalSubmitted, setPaypalSubmitted] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);

  // Promo Code States
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  const supabase = createClient();

  async function initializeCheckout(code?: string) {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          planId,
          promoCode: code || undefined,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(
          resData.error || "Failed to initialize checkout session",
        );
      }

      if (resData.completed) {
        setPaymentCompleted(true);
        setTimeout(() => {
          if (resData.courseSlug) {
            router.push(`/courses/${resData.courseSlug}`);
          } else {
            router.push("/dashboard");
          }
        }, 1500);
        return;
      }

      setCheckoutData({
        billNumber: resData.billNumber,
        amount: resData.amount,
        khqrPayload: resData.khqrPayload,
        courseSlug: resData.courseSlug,
      });
    } catch (err: any) {
      console.error("Checkout loading error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // 1. Redirect guests & fetch course details
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    if (!courseId && !planId) {
      setError("No product selected for checkout.");
      setLoading(false);
      return;
    }

    async function loadProductAndInitialize() {
      try {
        setLoading(true);
        setError(null);

        // Fetch course name
        if (courseId) {
          const { data: course, error: courseErr } = await supabase
            .from("courses")
            .select("title")
            .eq("course_id", courseId)
            .single();

          if (courseErr || !course) {
            throw new Error("Course not found in catalog");
          }
          setCourseTitle(course.title);
        } else if (planId) {
          const { data: plan, error: planErr } = await supabase
            .from("subscription_plans")
            .select("name")
            .eq("plan_id", parseInt(planId))
            .single();

          if (planErr || !plan) {
            throw new Error("Subscription plan not found");
          }
          setCourseTitle(plan.name);
        }

        await initializeCheckout();
      } catch (err: any) {
        console.error("Checkout loading error:", err);
        setError(err.message || "An unexpected error occurred.");
        setLoading(false);
      }
    }

    loadProductAndInitialize();
  }, [user, authLoading, courseId, planId]);

  // Promo Code Validation Handler
  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    try {
      setIsValidatingPromo(true);
      setPromoError(null);
      const { data, error: promoErr } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCodeInput.toUpperCase().trim())
        .single();

      if (promoErr || !data) {
        setPromoError("Invalid promo code.");
        return;
      }

      if (!data.is_active) {
        setPromoError("This promo code is inactive.");
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setPromoError("This promo code has expired.");
        return;
      }

      if (
        data.max_redemptions !== null &&
        data.redemptions_count >= data.max_redemptions
      ) {
        setPromoError("This promo code has reached its usage limit.");
        return;
      }

      setAppliedPromo(data);
      await initializeCheckout(data.code);
    } catch (err: any) {
      setPromoError("Failed to validate promo code.");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleTelegramClick = async () => {
    try {
      if (user?.email && courseId) {
        await supabase.from("pending_enrollments").upsert(
          {
            email: user.email.toLowerCase(),
            course_id: courseId,
            status: "pending",
            payment_method: "telegram",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email,course_id" },
        );
      }
    } catch (err) {
      console.warn("Failed to create pending enrollment:", err);
    }
    window.open("https://t.me/bunsambath10", "_blank");
  };

  const paypalHandle = process.env.NEXT_PUBLIC_PAYPAL_HANDLE || "bunsambath10";
  const paypalAmountFormatted = checkoutData?.amount ? checkoutData.amount.toFixed(2) : "49.00";
  const paypalPayUrl = `https://paypal.me/${paypalHandle}/${paypalAmountFormatted}USD`;
  const paypalOrderRef = checkoutData?.billNumber || (user && courseId ? `ATB-${(checkoutData?.courseSlug || 'COURSE').toUpperCase().slice(0, 4)}-${user.id.slice(0, 6)}` : 'ATB-PAYPAL-ORDER');

  const handleSubmitPaypal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      setPaypalError("Please sign in to submit your PayPal payment.");
      return;
    }
    if (!courseId) {
      setPaypalError("Course ID missing from checkout session.");
      return;
    }
    if (!paypalTxId.trim() && !paypalReceiptFile) {
      setPaypalError("Please enter your PayPal Transaction ID or attach a payment receipt.");
      return;
    }

    setIsSubmittingPaypal(true);
    setPaypalError(null);

    try {
      let uploadedProofUrl: string | null = null;

      if (paypalReceiptFile) {
        const fileExt = paypalReceiptFile.name.split(".").pop() || "png";
        const fileName = `paypal-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("payment-proofs")
          .upload(filePath, paypalReceiptFile, { upsert: true });

        if (uploadErr) {
          // Fallback to avatars bucket if payment-proofs bucket is not yet active
          const { error: fallbackErr } = await supabase.storage
            .from("avatars")
            .upload(`proofs/${fileName}`, paypalReceiptFile, { upsert: true });

          if (!fallbackErr) {
            const { data: pubData } = supabase.storage
              .from("avatars")
              .getPublicUrl(`proofs/${fileName}`);
            uploadedProofUrl = pubData.publicUrl;
          } else {
            console.warn("Proof storage upload warning:", uploadErr.message);
          }
        } else if (uploadData) {
          const { data: pubData } = supabase.storage
            .from("payment-proofs")
            .getPublicUrl(filePath);
          uploadedProofUrl = pubData.publicUrl;
        }
      }

      const { error: insertErr } = await supabase
        .from("pending_enrollments")
        .upsert(
          {
            email: user.email.toLowerCase(),
            course_id: courseId,
            status: "pending",
            payment_method: "paypal",
            transaction_reference: paypalTxId.trim() || paypalOrderRef,
            proof_url: uploadedProofUrl,
            amount: checkoutData?.amount || 0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email,course_id" },
        );

      if (insertErr) {
        // Fallback for base columns if schema additions are not yet applied
        if (insertErr.code === "42703" || insertErr.message?.includes("column")) {
          const { error: fallbackDbErr } = await supabase
            .from("pending_enrollments")
            .upsert(
              {
                email: user.email.toLowerCase(),
                course_id: courseId,
                status: "pending",
              },
              { onConflict: "email,course_id" },
            );
          if (fallbackDbErr) throw fallbackDbErr;
        } else {
          throw insertErr;
        }
      }

      setPaypalSubmitted(true);
    } catch (err: any) {
      console.error("PayPal enrollment submission failed:", err);
      setPaypalError(err.message || "Failed to submit PayPal payment receipt");
    } finally {
      setIsSubmittingPaypal(false);
    }
  };

  // 2. Poll transaction status in real-time
  useEffect(() => {
    if (!checkoutData?.billNumber || paymentCompleted) return;

    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/checkout/status?billNumber=${checkoutData.billNumber}`,
        );
        const statusData = await response.json();

        if (response.ok && statusData.status === "completed") {
          clearInterval(checkInterval);
          setPaymentCompleted(true);

          // Auto-redirect to classroom or dashboard in 4 seconds
          setTimeout(() => {
            if (checkoutData.courseSlug) {
              router.push(`/courses/${checkoutData.courseSlug}`);
            } else {
              router.push("/dashboard");
            }
          }, 4000);
        }
      } catch (err) {
        console.warn("Error checking payment status polling:", err);
      }
    }, 3000);

    return () => clearInterval(checkInterval);
  }, [checkoutData, paymentCompleted, router]);

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "#9ACD32" }}
        />
        <span>Generating secure checkout payload...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex items-center justify-center py-20 px-6">
        <div className="max-w-md w-full bg-zinc-900/40 border border-zinc-850 p-8 rounded-3xl text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-900/30 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Checkout Error</h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              {error}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/courses">
              <Button
                className="w-full bg-primary text-black font-semibold py-6 rounded-xl"
                style={{ backgroundColor: "#9ACD32", color: "#000" }}
              >
                Browse Courses
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="ghost"
                className="w-full text-zinc-400 hover:text-white"
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow container mx-auto px-4 sm:px-6 py-20 sm:py-24 md:py-32 max-w-4xl relative z-10">
      {/* Breadcrumb back */}
      <div className="mb-6 sm:mb-8 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {!paymentCompleted && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 bg-zinc-900/20 p-1.5 border border-zinc-850 rounded-2xl">
          <button
            type="button"
            onClick={() => setPaymentMethod("khqr")}
            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-semibold text-xs transition-all ${
              paymentMethod === "khqr"
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-md"
                : "text-zinc-400 border border-transparent hover:text-white"
            }`}
          >
            Pay with KHQR (Scan QR)
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("paypal")}
            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-semibold text-xs transition-all ${
              paymentMethod === "paypal"
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-md"
                : "text-zinc-400 border border-transparent hover:text-white"
            }`}
          >
            Pay with PayPal (International)
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("telegram")}
            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-semibold text-xs transition-all ${
              paymentMethod === "telegram"
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-md"
                : "text-zinc-400 border border-transparent hover:text-white"
            }`}
          >
            Pay via Telegram (Manual)
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 bg-zinc-900/30 border border-zinc-850 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
        {/* Left panel: Order Details */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
              <CreditCard
                className="w-4 h-4 text-primary"
                style={{ color: "#9ACD32" }}
              />
              Secure Checkout Gateway
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {paymentCompleted
                ? "Payment Received!"
                : "Complete Your Purchase"}
            </h1>

            <div className="border border-zinc-800 bg-zinc-950/40 p-4 sm:p-5 rounded-2xl space-y-3.5">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500">
                  Selected Product
                </p>
                <p className="text-sm font-semibold text-white mt-0.5 break-words">
                  {courseTitle}
                </p>
              </div>
              <div className="border-t border-zinc-850/60 pt-3">
                <p className="text-[10px] uppercase font-bold text-zinc-500">
                  Order Bill Number
                </p>
                <p className="text-xs font-mono text-zinc-300 mt-0.5 break-all">
                  {checkoutData?.billNumber}
                </p>
              </div>
              <div className="border-t border-zinc-850/60 pt-3">
                <p className="text-[10px] uppercase font-bold text-zinc-500">
                  Total Cost
                </p>
                <p
                  className="text-xl font-bold text-primary mt-0.5"
                  style={{ color: "#9ACD32" }}
                >
                  ${checkoutData?.amount.toFixed(2)} USD
                </p>
              </div>

              {!paymentCompleted && paymentMethod === "khqr" && (
                <div className="border-t border-zinc-850/60 pt-3 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">
                    Promo Code
                  </p>
                  {appliedPromo ? (
                    <div className="flex justify-between items-center bg-zinc-950/80 p-2.5 rounded-xl border border-[#9ACD32]/25">
                      <span
                        className="text-xs font-semibold text-primary font-mono"
                        style={{ color: "#9ACD32" }}
                      >
                        {appliedPromo.code} Applied
                      </span>
                      <span className="text-xs font-bold text-green-400">
                        {appliedPromo.discount_type === "percentage"
                          ? `${appliedPromo.discount_value}% OFF`
                          : `$${appliedPromo.discount_value} OFF`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 flex-grow uppercase font-mono"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={isValidatingPromo || !promoCodeInput.trim()}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 h-9 sm:h-auto"
                      >
                        {isValidatingPromo ? "..." : "Apply"}
                      </Button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-[10px] text-red-400 mt-1">
                      {promoError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {paymentCompleted && (
            <div className="bg-green-950/20 border border-green-900/30 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                <CheckCircle className="w-5 h-5" />
                Course Unlocked Successfully!
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We have verified your payment transaction. You will be
                redirected to the visual classroom in a few seconds...
              </p>
              <Link
                href={
                  checkoutData?.courseSlug
                    ? `/courses/${checkoutData.courseSlug}`
                    : "/dashboard"
                }
              >
                <Button
                  className="w-full bg-primary text-black font-semibold mt-1"
                  style={{ backgroundColor: "#9ACD32", color: "#000" }}
                >
                  Go to Classroom Now
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right panel: Payment method dynamic content */}
        <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-zinc-850/80 pt-8 md:pt-0 md:pl-8 space-y-5">
          {paymentCompleted ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="w-20 h-20 rounded-full bg-green-950/30 border border-green-900/40 flex items-center justify-center text-green-400 animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Payment Confirmed
              </h3>
              <p className="text-xs text-zinc-400 text-center max-w-[250px] leading-relaxed">
                Thank you! Your transaction is verified. Preparing your visual
                curriculum sandbox...
              </p>
            </div>
          ) : paymentMethod === "khqr" ? (
            <>
              {/* Stylized KHQR Stand/Card */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 w-[285px] text-black">
                {/* Red header with KHQR Logo */}
                <div className="bg-[#c62828] text-white px-5 py-4 flex justify-center items-center font-black tracking-widest text-xl">
                  KHQR
                </div>

                {/* Merchant Name */}
                <div className="px-5 py-4 text-center">
                  <p className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase">
                    Merchant Name
                  </p>
                  <p className="text-sm font-black text-zinc-800 tracking-wide mt-0.5">
                    SAMBATH BUN
                  </p>
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-zinc-300 mx-5 my-1" />

                {/* QR Code with absolute centered emblem */}
                <div className="p-6 flex items-center justify-center relative">
                  <div className="relative">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(checkoutData?.khqrPayload || "")}`}
                      alt="Bakong KHQR Code"
                      className="w-48 h-48 object-contain"
                    />
                    {/* Centered Dollar circular emblem */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-zinc-950 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                      <span className="text-white font-black text-sm">$</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2 max-w-[280px]">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400">
                  <Loader2
                    className="w-3.5 h-3.5 animate-spin text-primary"
                    style={{ color: "#9ACD32" }}
                  />
                  Awaiting scan confirmation...
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Open your **Bakong Wallet** or any Cambodian mobile banking
                  app (ABA, Acleda, etc.), scan this KHQR code, and authorize
                  payment to unlock instantly.
                </p>
              </div>
            </>
          ) : paymentMethod === "paypal" ? (
            <div className="w-full space-y-5">
              {paypalSubmitted ? (
                <div className="bg-zinc-950/80 border border-zinc-800 p-6 rounded-2xl text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-blue-950/40 border border-blue-900/50 flex items-center justify-center mx-auto text-blue-400">
                    <FileCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Payment Proof Submitted!</h3>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Your transaction reference has been logged. The instructor will verify your PayPal payment and activate course access shortly.
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300">
                    Order Reference: <span className="font-bold text-primary" style={{ color: "#9ACD32" }}>{paypalOrderRef}</span>
                  </div>
                  <Link href="/dashboard">
                    <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold py-3 rounded-xl mt-2">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Stylized PayPal Stand/Card */}
                  <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 w-[285px] mx-auto text-black">
                    <div className="bg-[#003087] text-white px-5 py-3.5 flex justify-center items-center font-black tracking-wider text-lg">
                      PayPal
                    </div>

                    <div className="px-5 py-3 text-center">
                      <p className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase">
                        Instructor PayPal
                      </p>
                      <p className="text-xs font-black text-zinc-800 tracking-wide mt-0.5">
                        Bun Sambath ({paypalHandle})
                      </p>
                    </div>

                    <div className="border-t border-dashed border-zinc-300 mx-5" />

                    <div className="p-5 flex items-center justify-center relative">
                      <div className="relative">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paypalPayUrl)}`}
                          alt="PayPal Payment QR"
                          className="w-44 h-44 object-contain"
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#003087] rounded-full border-2 border-white flex items-center justify-center shadow-md">
                          <span className="text-white font-black text-xs">P</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 w-full">
                    <a
                      href={paypalPayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs bg-[#0070BA] hover:bg-[#003087] text-white transition-colors text-center"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Open PayPal.me (${paypalAmountFormatted} USD)
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">
                          Required Note / Order Ref
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(paypalOrderRef);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                          className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                          style={{ color: "#9ACD32" }}
                        >
                          <Copy className="w-3 h-3" />
                          {isCopied ? "Copied!" : "Copy Ref"}
                        </button>
                      </div>
                      <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 text-xs text-primary font-mono select-all text-center font-bold" style={{ color: "#9ACD32" }}>
                        {paypalOrderRef}
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">
                        Please enter this reference code into the PayPal note when sending your payment.
                      </p>
                    </div>

                    {/* Payment Proof Form */}
                    <form onSubmit={handleSubmitPaypal} className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-white">Submit Payment Details</p>
                      
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                          PayPal Transaction ID / Email
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 9X928491823 or your PayPal email"
                          value={paypalTxId}
                          onChange={(e) => setPaypalTxId(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                          Upload Receipt Screenshot (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPaypalReceiptFile(e.target.files?.[0] || null)}
                            className="text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer w-full"
                          />
                        </div>
                      </div>

                      {paypalError && (
                        <p className="text-[10px] text-red-400 leading-tight">
                          {paypalError}
                        </p>
                      )}

                      <Button
                        type="submit"
                        disabled={isSubmittingPaypal}
                        className="w-full bg-primary text-black font-semibold text-xs py-2.5 rounded-lg mt-1"
                        style={{ backgroundColor: "#9ACD32", color: "#000" }}
                      >
                        {isSubmittingPaypal ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" /> Submit Payment Verification
                          </span>
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full space-y-5">
              <div className="bg-zinc-950/60 border border-zinc-850 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Telegram Payment Steps
                </h3>

                <ol className="text-xs text-zinc-400 space-y-3 list-decimal list-inside leading-relaxed">
                  <li>
                    Copy the template message containing your account details
                    below.
                  </li>
                  <li>
                    Click the button to open direct Telegram chat with
                    instructor **Bun Sambath**.
                  </li>
                  <li>
                    Send the copied message along with your **payment
                    receipt/invoice**.
                  </li>
                  <li>
                    Once the instructor verifies and unlocks it, the course will
                    be **automatically unlocked** under your email address!
                  </li>
                </ol>
              </div>

              <div className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">
                    Message Template
                  </span>
                  <button
                    onClick={() => {
                      const text = `Hi Bun Sambath, I paid for "${courseTitle}". Please unlock it for my email: "${user?.email || ""}". (Order ref: ${checkoutData?.billNumber})`;
                      navigator.clipboard.writeText(text);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                    style={{ color: "#9ACD32" }}
                  >
                    <Copy className="w-3 h-3" />
                    {isCopied ? "Copied!" : "Copy Message"}
                  </button>
                </div>

                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 text-xs text-zinc-300 font-mono select-all leading-normal">
                  Hi Bun Sambath, I paid for "{courseTitle}". Please unlock it
                  for my email: "{user?.email || ""}". (Order ref:{" "}
                  {checkoutData?.billNumber})
                </div>
              </div>

              <button
                type="button"
                onClick={handleTelegramClick}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm bg-primary text-black transition-all hover:brightness-110 text-center"
                style={{ backgroundColor: "#9ACD32", color: "#000" }}
              >
                Go to Telegram Chat
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main
      className="min-h-screen flex flex-col justify-between bg-zinc-950 text-white"
      style={{ backgroundColor: "#060010" }}
    >
      <Navigation />
      <Suspense
        fallback={
          <div className="flex-grow flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: "#9ACD32" }}
            />
            <span>Initializing secure checkout window...</span>
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
      <Footer />
    </main>
  );
}
