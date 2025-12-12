import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Leaf,
  Shield,
  BarChart3,
  MapPin,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Droplets,
  Factory,
  Recycle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#1B4332] rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-[#D4A853]" />
              </div>
              <span className="text-xl font-bold text-[#1B4332]">ABFI</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-[#1B4332] transition-colors">
                About
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-[#1B4332] transition-colors">
                Pricing
              </Link>
              <Link href="/resources" className="text-sm font-medium text-gray-600 hover:text-[#1B4332] transition-colors">
                Resources
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1B4332] text-white">
        <div className="container relative mx-auto px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4A853] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D4A853]" />
              </span>
              Now accepting early access applications
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Australia&apos;s Bioenergy{" "}
              <span className="text-[#D4A853]">Feedstock Marketplace</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-200">
              Connect verified feedstock suppliers with bioenergy producers
              through standardised ABFI ratings, transparent carbon intensity
              data, and secure marketplace functionality.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="bg-[#D4A853] hover:bg-[#C49943] text-[#1B4332] font-semibold px-8">
                <Link href="/register?role=supplier">
                  Register as Supplier
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/30 bg-white/10 hover:bg-white/20 text-white px-8">
                <Link href="/register?role=buyer">Register as Buyer</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "$10B+", label: "Industry Opportunity" },
              { value: "$1.1B", label: "Government Investment" },
              { value: "50%", label: "Suppliers Need Demand Signals" },
              { value: "100+", label: "Feedstock Types" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-[#1B4332]">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1B4332] sm:text-4xl">
              Bridging the Feedstock Gap
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Australia&apos;s bioenergy industry faces a critical coordination
              challenge. ABFI provides the infrastructure to connect supply with demand.
            </p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            <Card className="border-red-100 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-red-800">The Challenge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "50% of suppliers need demand signals before committing supply",
                  "Producers struggle to find verified feedstock sources",
                  "No standardised quality or sustainability ratings",
                  "Carbon intensity data is fragmented and unverified",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span className="text-sm text-red-700">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-green-100 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-green-800">The Solution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Aggregated demand signals give suppliers confidence to invest",
                  "Verified supplier profiles with ABFI Score ratings",
                  "Standardised quality parameters by feedstock type",
                  "Integrated carbon intensity calculator and verification",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-sm text-green-700">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ABFI Score Section */}
      <section className="bg-[#1B4332] py-24 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The ABFI Score System
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              A comprehensive 0-100 rating derived from four weighted pillars,
              giving buyers confidence and suppliers recognition.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: "Sustainability", weight: "30%", description: "Certifications, land use compliance, social responsibility" },
              { icon: Droplets, title: "Carbon Intensity", weight: "30%", description: "gCO2e/MJ benchmarked against RED II standards" },
              { icon: BarChart3, title: "Quality", weight: "25%", description: "Physical/chemical parameters by feedstock type" },
              { icon: TrendingUp, title: "Reliability", weight: "15%", description: "Delivery performance, consistency, platform history" },
            ].map((pillar) => (
              <Card key={pillar.title} className="border-white/10 bg-white/5 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <pillar.icon className="h-8 w-8 text-[#D4A853]" />
                    <span className="text-2xl font-bold text-[#D4A853]">{pillar.weight}</span>
                  </div>
                  <CardTitle className="text-white">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feedstock Types Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1B4332] sm:text-4xl">
              Supported Feedstock Categories
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From oilseeds to waste streams, ABFI covers the full spectrum of bioenergy feedstocks.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Oilseeds", types: "Canola, Mustard, Camelina", icon: "🌻" },
              { name: "Used Cooking Oil", types: "Restaurant, Industrial", icon: "🍳" },
              { name: "Tallow & Animal Fats", types: "Beef, Poultry, Pork", icon: "🥩" },
              { name: "Lignocellulosic", types: "Bagasse, Straw, Wood chips", icon: "🌾" },
              { name: "Waste Streams", types: "MSW Organic, Food waste", icon: "♻️" },
              { name: "Algae", types: "Microalgae, Macroalgae", icon: "🌿" },
            ].map((category) => (
              <Card key={category.name} className="hover:border-[#2D6A4F] transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>{category.types}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1B4332] sm:text-4xl">How ABFI Works</h2>
            <p className="mt-4 text-lg text-gray-600">Simple, transparent, and efficient feedstock trading.</p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-semibold text-[#1B4332]">
                <Factory className="h-6 w-6" /> For Suppliers
              </h3>
              <div className="mt-6 space-y-6">
                {[
                  { step: "1", title: "Register & Verify", desc: "Create your account, verify ABN, complete company profile" },
                  { step: "2", title: "List Feedstocks", desc: "Add your feedstock sources with location, volume, and certifications" },
                  { step: "3", title: "Get Rated", desc: "Receive your ABFI Score based on sustainability, quality, and reliability" },
                  { step: "4", title: "Connect & Trade", desc: "Respond to buyer inquiries and grow your business" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B4332] text-white font-semibold shrink-0">{item.step}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-xl font-semibold text-[#1B4332]">
                <Recycle className="h-6 w-6" /> For Buyers
              </h3>
              <div className="mt-6 space-y-6">
                {[
                  { step: "1", title: "Register & Set Requirements", desc: "Create account and specify your feedstock needs and preferences" },
                  { step: "2", title: "Search & Filter", desc: "Find feedstocks by type, location, ABFI score, and certifications" },
                  { step: "3", title: "Review Suppliers", desc: "Access detailed profiles, ratings, and verification status" },
                  { step: "4", title: "Inquire & Contract", desc: "Send inquiries, negotiate terms, and secure your supply" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4A853] text-[#1B4332] font-semibold shrink-0">{item.step}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1B4332] sm:text-4xl">Platform Features</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: MapPin, title: "Geospatial Search", desc: "Find feedstocks near your facility with interactive maps and radius filtering" },
              { icon: Shield, title: "Verified Certifications", desc: "ISCC, RSB, and RED II certifications tracked and verified" },
              { icon: BarChart3, title: "Carbon Calculator", desc: "Built-in LCA tool for calculating feedstock carbon intensity" },
              { icon: Users, title: "Supplier Profiles", desc: "Comprehensive profiles with ratings, history, and documentation" },
              { icon: TrendingUp, title: "Market Intelligence", desc: "Aggregated supply data, price indices, and demand signals" },
              { icon: CheckCircle, title: "Audit Trail", desc: "Complete chain of custody and compliance documentation" },
            ].map((feature) => (
              <Card key={feature.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-[#1B4332]" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] py-24 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Transform Australia&apos;s Bioenergy Supply Chain?
            </h2>
            <p className="mt-4 text-lg text-gray-200">
              Join the growing network of verified suppliers and buyers on Australia&apos;s first national feedstock platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="bg-[#D4A853] hover:bg-[#C49943] text-[#1B4332] font-semibold px-8">
                <Link href="/register">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/30 bg-white/10 hover:bg-white/20 text-white">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#1B4332] rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-[#D4A853]" />
                </div>
                <span className="font-bold text-[#1B4332]">ABFI</span>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Australian Bioenergy Feedstock Institute - connecting supply with demand for a sustainable future.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Platform</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li><Link href="/buyer/search" className="hover:text-[#1B4332]">Search Feedstocks</Link></li>
                <li><Link href="/register" className="hover:text-[#1B4332]">Register</Link></li>
                <li><Link href="/pricing" className="hover:text-[#1B4332]">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Resources</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li><Link href="/about" className="hover:text-[#1B4332]">About ABFI</Link></li>
                <li><Link href="/resources/rating" className="hover:text-[#1B4332]">Rating System</Link></li>
                <li><Link href="/resources/certifications" className="hover:text-[#1B4332]">Certifications Guide</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li><Link href="/privacy" className="hover:text-[#1B4332]">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#1B4332]">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Australian Bioenergy Feedstock Institute. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
