import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Leaf,
  Check,
  X,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for feedstock suppliers and bioenergy buyers on the ABFI platform.",
};

const supplierPlans = [
  {
    name: "Starter",
    description: "For small suppliers getting started",
    price: "Free",
    period: "",
    features: [
      { text: "1 feedstock listing", included: true },
      { text: "Basic ABFI score", included: true },
      { text: "Inquiry inbox", included: true },
      { text: "Email support", included: true },
      { text: "Verified badge", included: false },
      { text: "Priority listing", included: false },
      { text: "Analytics dashboard", included: false },
      { text: "API access", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    description: "For growing suppliers",
    price: "$199",
    period: "/month",
    features: [
      { text: "10 feedstock listings", included: true },
      { text: "Full ABFI score breakdown", included: true },
      { text: "Inquiry inbox + notifications", included: true },
      { text: "Priority email support", included: true },
      { text: "Verified badge", included: true },
      { text: "Priority listing", included: true },
      { text: "Analytics dashboard", included: false },
      { text: "API access", included: false },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large-scale operations",
    price: "Custom",
    period: "",
    features: [
      { text: "Unlimited listings", included: true },
      { text: "Full ABFI score + custom metrics", included: true },
      { text: "Dedicated inquiry management", included: true },
      { text: "24/7 phone support", included: true },
      { text: "Premium verified badge", included: true },
      { text: "Featured listings", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Full API access", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const buyerPlans = [
  {
    name: "Explorer",
    description: "Browse and discover feedstocks",
    price: "Free",
    period: "",
    features: [
      { text: "Search all feedstocks", included: true },
      { text: "View ABFI scores", included: true },
      { text: "5 inquiries/month", included: true },
      { text: "Email support", included: true },
      { text: "Shortlist (10 items)", included: true },
      { text: "Saved searches", included: false },
      { text: "Bulk inquiry tools", included: false },
      { text: "Market analytics", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Procurement",
    description: "Active feedstock sourcing",
    price: "$299",
    period: "/month",
    features: [
      { text: "Search all feedstocks", included: true },
      { text: "Full ABFI score details", included: true },
      { text: "Unlimited inquiries", included: true },
      { text: "Priority support", included: true },
      { text: "Unlimited shortlist", included: true },
      { text: "Saved searches + alerts", included: true },
      { text: "Bulk inquiry tools", included: true },
      { text: "Market analytics", included: false },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Large-scale procurement",
    price: "Custom",
    period: "",
    features: [
      { text: "Everything in Procurement", included: true },
      { text: "Custom scoring criteria", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "24/7 phone support", included: true },
      { text: "Contract management", included: true },
      { text: "Compliance reporting", included: true },
      { text: "Market analytics + forecasts", included: true },
      { text: "Full API access", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-800 text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-bold text-green-900">ABFI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm font-medium text-gray-600 hover:text-green-800"
            >
              About
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-green-800"
            >
              Pricing
            </Link>
            <Link
              href="/tools/carbon-calculator"
              className="text-sm font-medium text-gray-600 hover:text-green-800"
            >
              Carbon Calculator
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-6 text-xl text-gray-600">
            Choose the plan that fits your needs. All plans include access to
            Australia&apos;s most comprehensive bioenergy feedstock marketplace.
          </p>
        </div>
      </section>

      {/* Supplier Plans */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              For Suppliers
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900">Supplier Plans</h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              List your feedstocks, get rated, and connect with biofuel producers
              across Australia.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {supplierPlans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.popular ? "border-green-500 border-2" : ""}
              >
                {plan.popular && (
                  <div className="bg-green-500 text-white text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300" />
                        )}
                        <span
                          className={
                            feature.included ? "text-gray-900" : "text-gray-400"
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/register?role=supplier">
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Buyer Plans */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              For Buyers
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900">Buyer Plans</h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Find, compare, and source verified feedstocks from trusted suppliers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {buyerPlans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.popular ? "border-green-500 border-2" : ""}
              >
                {plan.popular && (
                  <div className="bg-green-500 text-white text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300" />
                        )}
                        <span
                          className={
                            feature.included ? "text-gray-900" : "text-gray-400"
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/register?role=buyer">
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6">
            {[
              {
                q: "Can I change plans at any time?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes, all paid plans include a 14-day free trial. No credit card required to start.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, bank transfers, and can arrange invoicing for Enterprise customers.",
              },
              {
                q: "Can I be both a supplier and buyer?",
                a: "Yes, you can register for both roles with the same account. Each role has its own subscription.",
              },
              {
                q: "What&apos;s included in the Enterprise plan?",
                a: "Enterprise plans are customized to your needs. Contact our sales team to discuss your requirements and get a tailored quote.",
              },
            ].map((faq) => (
              <Card key={faq.q}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-green-700" />
                    {faq.q}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-green-900 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mt-4 text-green-100">
            Join hundreds of suppliers and buyers already using ABFI.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-amber-500 text-gray-900 hover:bg-amber-400"
              asChild
            >
              <Link href="/register">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-green-800"
              asChild
            >
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-800 text-white">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="font-bold text-green-900">ABFI</span>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Australian Bioenergy Feedstock
              Institute. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
