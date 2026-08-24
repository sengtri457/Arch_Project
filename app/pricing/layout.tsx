import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing - Archtipsbox",
  description: "Masterclass courses and subscription plans for architectural visualization students.",
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
