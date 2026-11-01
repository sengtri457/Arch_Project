import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing & Course Plans",
  description:
    "Transparent pricing for Archtipsbox architectural masterclasses, subscriptions, and professional visualization training courses.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing & Course Plans | Archtipsbox",
    description: "Masterclass courses and subscription plans for architectural visualization students.",
    url: "/pricing",
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
