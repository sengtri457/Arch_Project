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
  Check,
  CreditCard,
  AlertCircle,
  Lock,
  ArrowLeft,
  ArrowRight,
  Send,
  Copy,
  ExternalLink,
  Upload,
  Globe,
  FileCheck,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { buildGumroadCheckoutUrl } from "@/lib/gumroad";
import { courses as localCourses } from "@/lib/courses-data";

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
    originalAmount?: number;
    khqrPayload: string;
    courseSlug: string;
  } | null>(null);

  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"khqr" | "telegram" | "international">(
    "khqr",
  );
  const [isCopied, setIsCopied] = useState(false);

  // Gumroad International Checkout States
  const [isRedirectingGumroad, setIsRedirectingGumroad] = useState(false);
  const [gumroadClicked, setGumroadClicked] = useState(false);
  const [customGumroadUrl, setCustomGumroadUrl] = useState<string | null>(null);

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

      setCheckoutData((prev) => ({
        billNumber: resData.billNumber,
        amount: resData.amount,
        originalAmount: resData.originalAmount ?? prev?.originalAmount ?? resData.amount,
        khqrPayload: resData.khqrPayload,
        courseSlug: resData.courseSlug,
      }));
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

        // Fetch course name & international link
        if (courseId) {
          const matchedLocal = localCourses.find(
            (c) => c.course_id === courseId || c.id === courseId
          );
          if (matchedLocal?.gumroad_url) {
            setCustomGumroadUrl(matchedLocal.gumroad_url);
          }

          const { data: course, error: courseErr } = await supabase
            .from("courses")
            .select("*")
            .eq("course_id", courseId)
            .single();

          if (courseErr || !course) {
            throw new Error("Course not found in catalog");
          }
          setCourseTitle(course.title);
          if ((course as any).gumroad_url) {
            setCustomGumroadUrl((course as any).gumroad_url);
          }
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
  const handleRemovePromo = async () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError(null);
    await initializeCheckout();
  };

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

  const getGumroadUrl = () => {
    return buildGumroadCheckoutUrl(customGumroadUrl || undefined, {
      email: user?.email || undefined,
      wanted: true,
      discountCode: appliedPromo?.code || undefined,
      customFields: checkoutData?.billNumber
        ? { bill_number: checkoutData.billNumber }
        : undefined,
    });
  };

  const handleGumroadRedirect = async () => {
    setIsRedirectingGumroad(true);
    try {
      if (user?.email && courseId) {
        await supabase.from("pending_enrollments").upsert(
          {
            email: user.email.toLowerCase(),
            course_id: courseId,
            status: "pending",
            payment_method: "gumroad",
            transaction_reference: checkoutData?.billNumber || `GUM-${Date.now()}`,
            amount: checkoutData?.amount || 0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email,course_id" },
        );
      }
    } catch (err) {
      console.warn("Failed to record Gumroad enrollment attempt:", err);
    } finally {
      setIsRedirectingGumroad(false);
      setGumroadClicked(true);
      window.open(getGumroadUrl(), "_blank", "noopener,noreferrer");
    }
  };

  // 2. Poll transaction status in real-time (for Bakong KHQR)
  useEffect(() => {
    if (paymentCompleted) return;

    // Bakong KHQR Polling
    if (paymentMethod === "khqr" && checkoutData?.billNumber) {
      const checkInterval = setInterval(async () => {
        try {
          const response = await fetch(
            `/api/checkout/status?billNumber=${checkoutData.billNumber}`,
          );
          const statusData = await response.json();

          if (response.ok && statusData.status === "completed") {
            clearInterval(checkInterval);
            setPaymentCompleted(true);

            // Auto-redirect to classroom or dashboard
            setTimeout(() => {
              if (checkoutData.courseSlug) {
                router.push(`/courses/${checkoutData.courseSlug}`);
              } else {
                router.push("/dashboard");
              }
            }, 3500);
          }
        } catch (err) {
          console.warn("Error checking Bakong payment status polling:", err);
        }
      }, 3000);

      return () => clearInterval(checkInterval);
    }
  }, [
    checkoutData,
    paymentMethod,
    paymentCompleted,
    router,
  ]);

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
    <div className="flex-grow container mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24 max-w-5xl relative z-10">
      {/* Top Header & Breadcrumb */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-[#9ACD32]" />
          <span>256-bit SSL Encrypted Gateway</span>
        </div>
      </div>

      {!paymentCompleted && (
        <div className="mb-8">
          <div className="grid grid-cols-3 p-1.5 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl shadow-xl gap-1.5">
            <button
              type="button"
              onClick={() => setPaymentMethod("khqr")}
              className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap min-w-0 ${
                paymentMethod === "khqr"
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-md"
                  : "text-zinc-400 border border-transparent hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              <img
                src="/logo-payment/KHQR-available-here-logo-with-bg.webp"
                alt="KHQR"
                className="h-6 sm:h-7 w-auto object-contain rounded shrink-0 shadow-sm"
              />
              <span className="truncate font-bold">KHQR Scan</span>
              <span className="hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-700/60 shrink-0">
                Cambodia
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("international")}
              className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap min-w-0 ${
                paymentMethod === "international"
                  ? "bg-sky-500/15 text-sky-300 border border-sky-500/40 shadow-md"
                  : "text-zinc-400 border border-transparent hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              <img
                src="/logo-payment/visacard.png"
                alt="Cards / Apple Pay"
                className="h-5 sm:h-6 w-auto object-contain shrink-0"
              />
              <span className="truncate font-bold">Cards / Apple Pay</span>
              <span className="hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-950/80 text-sky-300 border border-sky-800/60 shrink-0">
                Global
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("telegram")}
              className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap min-w-0 ${
                paymentMethod === "telegram"
                  ? "bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/40 shadow-md"
                  : "text-zinc-400 border border-transparent hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              <img
                src="/logo-payment/telegram.webp"
                alt="Telegram"
                className="h-6 sm:h-7 w-auto object-contain shrink-0"
              />
              <span className="truncate font-bold">Telegram</span>
              <span className="hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-700/60 shrink-0">
                Direct
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-zinc-950/60 border border-zinc-800/80 p-5 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
        {/* Left panel: Order Details (42% width on desktop) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
              <CreditCard
                className="w-4 h-4 text-primary"
                style={{ color: "#9ACD32" }}
              />
              Order Overview
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {paymentCompleted
                ? "Payment Received!"
                : "Order Summary"}
            </h1>

            <div className="border border-zinc-800/90 bg-zinc-900/40 p-4 sm:p-5 rounded-2xl space-y-3.5">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Selected Course
                </p>
                <p className="text-sm font-semibold text-white mt-1 break-words">
                  {courseTitle}
                </p>
              </div>

              <div className="border-t border-zinc-850/80 pt-3">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Order Reference
                </p>
                <p className="text-xs font-mono text-zinc-300 mt-1 break-all">
                  {checkoutData?.billNumber}
                </p>
              </div>

              <div className="border-t border-zinc-850/80 pt-3">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Total Amount Due
                </p>
                {checkoutData && checkoutData.originalAmount && checkoutData.originalAmount > checkoutData.amount ? (
                  <div className="flex items-baseline flex-wrap gap-2.5 mt-1">
                    <span className="text-sm font-semibold text-zinc-500 line-through decoration-zinc-400">
                      ${checkoutData.originalAmount.toFixed(2)} USD
                    </span>
                    <span
                      className="text-2xl font-black text-primary"
                      style={{ color: "#9ACD32" }}
                    >
                      ${checkoutData.amount.toFixed(2)} USD
                    </span>
                  </div>
                ) : (
                  <p
                    className="text-2xl font-black text-primary mt-1"
                    style={{ color: "#9ACD32" }}
                  >
                    ${checkoutData?.amount.toFixed(2)} USD
                  </p>
                )}
              </div>

              {!paymentCompleted && (
                <div className="border-t border-zinc-850/80 pt-3 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    Discount / Promo Code
                  </p>
                  {appliedPromo ? (
                    <div className="flex justify-between items-center bg-zinc-950/80 p-2.5 rounded-xl border border-[#9ACD32]/25">
                      <span
                        className="text-xs font-semibold text-primary font-mono"
                        style={{ color: "#9ACD32" }}
                      >
                        {appliedPromo.code} Applied
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-green-400">
                          {appliedPromo.discount_type === "percentage"
                            ? `${appliedPromo.discount_value}% OFF`
                            : `$${appliedPromo.discount_value} OFF`}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-zinc-500 hover:text-zinc-300 text-xs px-1 rounded transition-colors"
                          title="Remove promo code"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="COUPON CODE"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 flex-grow uppercase font-mono"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={isValidatingPromo || !promoCodeInput.trim()}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 h-9"
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

            {/* Trust highlights */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900/30 border border-zinc-850/60">
                <Check className="w-3.5 h-3.5 text-[#9ACD32] shrink-0" />
                <span>Instant Access</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900/30 border border-zinc-850/60">
                <Check className="w-3.5 h-3.5 text-[#9ACD32] shrink-0" />
                <span>Verified Certificate</span>
              </div>
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

        {/* Right panel: Payment method dynamic content (58% width on desktop) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-zinc-800/80 pt-8 lg:pt-0 lg:pl-8 space-y-5">
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
            <div className="flex flex-col items-center justify-center space-y-4 w-full">
              {/* Proportional Stylized KHQR Stand/Card */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 w-[250px] text-black">
                {/* Red header with KHQR Logo */}
                <div className="bg-[#c62828] text-white px-4 py-3 flex justify-center items-center font-black tracking-widest text-lg">
                  KHQR
                </div>

                {/* Merchant Name */}
                <div className="px-4 py-3 text-center">
                  <p className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase">
                    Merchant Name
                  </p>
                  <p className="text-sm font-black text-zinc-800 tracking-wide mt-0.5">
                    SAMBATH BUN
                  </p>
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-zinc-300 mx-4 my-0.5" />

                {/* QR Code with absolute centered emblem */}
                <div className="p-4 flex items-center justify-center relative">
                  <div className="relative">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkoutData?.khqrPayload || "")}`}
                      alt="Bakong KHQR Code"
                      className="w-40 h-40 object-contain"
                    />
                    {/* Centered Dollar circular emblem */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-zinc-950 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                      <span className="text-white font-black text-xs">$</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2 max-w-[300px]">
                <div className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-zinc-300 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                  <Loader2
                    className="w-3.5 h-3.5 animate-spin text-primary"
                    style={{ color: "#9ACD32" }}
                  />
                  <span>Waiting for scan confirmation...</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Open your <strong>Bakong Wallet</strong> or any Cambodian banking app (ABA, Acleda, Canadia), scan this KHQR code, and authorize payment to unlock instantly.
                </p>
              </div>
            </div>
          ) : paymentMethod === "international" ? (
            <div className="w-full space-y-4">
              <div className="bg-zinc-950/70 border border-zinc-800/90 p-5 sm:p-6 rounded-3xl space-y-5 shadow-xl relative overflow-hidden">
                {/* Decorative subtle ambient glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Card Header */}
                <div className="flex items-start justify-between gap-4 border-b border-zinc-850/80 pb-3.5 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-sky-500/15 text-sky-400 px-2.5 py-0.5 rounded-full border border-sky-500/25">
                        Global Checkout
                      </span>
                      <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                        Verified Storefront
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Credit Cards & Apple Pay
                    </h3>
                  </div>
                  <div className="h-10 px-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <img src="/logo-payment/visacard.png" alt="Cards" className="h-5 w-auto object-contain" />
                  </div>
                </div>

                {/* Accepted Payment Methods Pills */}
                <div className="space-y-1.5 relative z-10">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    Accepted Methods
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {["Visa", "MasterCard", "Amex", "Apple Pay", "Google Pay"].map((method) => (
                      <span
                        key={method}
                        className="text-[11px] font-semibold text-zinc-300 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-lg"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Benefits */}
                <div className="bg-zinc-900/40 border border-zinc-850/70 p-3.5 rounded-2xl space-y-2 text-xs text-zinc-300 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Instant visual curriculum unlock upon successful checkout</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="truncate">
                      Pre-filled with your student account:{" "}
                      <span className="text-white font-mono">{user?.email}</span>
                    </span>
                  </div>
                </div>

                {/* Linking Button Action */}
                <div className="space-y-2.5 pt-1 relative z-10">
                  <button
                    type="button"
                    onClick={handleGumroadRedirect}
                    disabled={isRedirectingGumroad}
                    className="w-full group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#9ACD32] hover:bg-[#8ab82b] text-black font-bold transition-all shadow-lg shadow-[#9ACD32]/15 active:scale-[0.99] cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded-xl bg-black/15 flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold leading-tight">
                          {isRedirectingGumroad ? "Opening Checkout..." : "Pay with Card / Apple Pay"}
                        </p>
                        <p className="text-[11px] font-medium text-black/75">
                          Securely processed on official Gumroad store
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2">
                      <span className="text-xs font-mono font-black bg-black/10 px-2.5 py-1 rounded-lg">
                        ${checkoutData?.amount?.toFixed(2) || "49.00"} USD
                      </span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>

                  <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
                    Zero international wire fees. 100% money-back satisfaction guarantee.
                  </p>
                </div>

                {/* Post-Click Reassurance Alert */}
                {gumroadClicked && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-[#9ACD32]/30 space-y-1.5 text-left relative z-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <CheckCircle className="w-4 h-4 text-[#9ACD32]" />
                      Checkout Window Opened
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Complete your payment in the opened tab. If the tab did not open,{" "}
                      <a
                        href={getGumroadUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9ACD32] underline font-semibold hover:text-white"
                      >
                        click here to open directly
                      </a>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <div className="bg-zinc-950/60 border border-zinc-850 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2.5">
                  <img src="/logo-payment/telegram.webp" alt="Telegram" className="w-8 h-8 object-contain shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Direct Telegram Support & Unlock
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Message the instructor directly to pay via alternative methods
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-850/80 pt-3">
                  <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Copy your pre-formatted order verification message below.</li>
                    <li>Click to open direct Telegram chat with instructor <strong>Bun Sambath</strong>.</li>
                    <li>Send the receipt to get your course unlocked under <strong>{user?.email}</strong>.</li>
                  </ol>
                </div>
              </div>

              <div className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-xl space-y-2.5">
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
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    style={{ color: "#9ACD32" }}
                  >
                    <Copy className="w-3 h-3" />
                    {isCopied ? "Copied to Clipboard!" : "Copy Template"}
                  </button>
                </div>

                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 text-xs text-zinc-300 font-mono select-all leading-relaxed break-all">
                  Hi Bun Sambath, I paid for "{courseTitle}". Please unlock it
                  for my email: "{user?.email || ""}". (Order ref:{" "}
                  {checkoutData?.billNumber})
                </div>
              </div>

              <button
                type="button"
                onClick={handleTelegramClick}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-primary text-black transition-all hover:brightness-110 text-center cursor-pointer shadow-lg shadow-[#9ACD32]/10"
                style={{ backgroundColor: "#9ACD32", color: "#000" }}
              >
                <span>Open Telegram Chat</span>
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
