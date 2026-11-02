/**
 * Gumroad International Checkout & Webhook Helper
 * Supports direct links for international students and handles webhook pings.
 */

export const DEFAULT_GUMROAD_D5_URL =
  process.env.NEXT_PUBLIC_GUMROAD_D5_URL ||
  "https://archtipsbox.gumroad.com/l/d5masterclass?wanted=true";

export interface GumroadUrlOptions {
  email?: string;
  wanted?: boolean;
  customFields?: Record<string, string>;
}

/**
 * Builds a clean, prefilled Gumroad checkout URL for international students.
 */
export function buildGumroadCheckoutUrl(
  baseUrl: string = DEFAULT_GUMROAD_D5_URL,
  options?: GumroadUrlOptions
): string {
  try {
    const url = new URL(baseUrl);

    if (options?.wanted !== undefined) {
      url.searchParams.set("wanted", options.wanted ? "true" : "false");
    } else if (!url.searchParams.has("wanted")) {
      url.searchParams.set("wanted", "true");
    }

    if (options?.email && options.email.trim()) {
      url.searchParams.set("email", options.email.trim().toLowerCase());
    }

    if (options?.customFields) {
      for (const [key, value] of Object.entries(options.customFields)) {
        if (value) {
          url.searchParams.set(key, value);
        }
      }
    }

    return url.toString();
  } catch {
    // Fallback if baseUrl is malformed
    const base = baseUrl.split("?")[0];
    const params = new URLSearchParams();
    params.set("wanted", "true");
    if (options?.email) {
      params.set("email", options.email.trim().toLowerCase());
    }
    return `${base}?${params.toString()}`;
  }
}

export interface GumroadSalePayload {
  sellerId?: string;
  productId?: string;
  productName?: string;
  permalink?: string;
  email: string;
  price: number; // in cents or dollars
  currency: string;
  saleId: string;
  orderNumber?: string;
  isTest?: boolean;
}

/**
 * Parses and normalizes incoming Gumroad ping/webhook data.
 */
export function parseGumroadPing(data: Record<string, any>): GumroadSalePayload | null {
  if (!data || typeof data !== "object") return null;

  const email = (data.email || data.buyer_email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return null;
  }

  const rawPrice = data.price || data.price_cents || 0;
  const price = typeof rawPrice === "number" ? rawPrice : parseFloat(rawPrice) || 0;

  return {
    sellerId: data.seller_id,
    productId: data.product_id,
    productName: data.product_name,
    permalink: data.permalink,
    email,
    price,
    currency: (data.currency || "USD").toUpperCase(),
    saleId: String(data.sale_id || data.id || `GUM-${Date.now()}`),
    orderNumber: data.order_number ? String(data.order_number) : undefined,
    isTest: Boolean(data.test || data.is_test),
  };
}
