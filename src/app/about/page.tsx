import { Metadata } from "next";
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
  ArrowRight,
  Leaf,
  Target,
  Users,
  Globe,
  Shield,
  TrendingUp,
  Building2,
  Plane,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About ABFI",
  description:
    "Learn about the Australian Bioenergy Feedstock Institute and our mission to accelerate Australia's transition to sustainable aviation fuel.",
};

export default function AboutPage() {
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
              className="text-sm font-medium text-green-800"
            >
              About
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-gray-600 hover:text-green-800"
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
            Powering Australia&apos;s
            <span className="text-green-700"> Sustainable Aviation</span> Future
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            The Australian Bioenergy Feedstock Institute connects feedstock
            suppliers with biofuel producers through standardised ratings,
            verified records, and transparent carbon accounting.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
              <p className="mt-4 text-gray-600">
                Australia has committed to net-zero emissions by 2050 and is
                developing a national Sustainable Aviation Fuel (SAF) mandate
                requiring 10% SAF in jet fuel by 2030. This represents an
                opportunity for Australian agriculture and waste industries to
                supply certified, sustainable feedstocks.
              </p>
              <p className="mt-4 text-gray-600">
                ABFI exists to bridge the gap between feedstock suppliers and
                biofuel producers by providing a trusted platform for discovery,
                qualification, and trade of bioenergy feedstocks with verified
                sustainability credentials.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Plane className="h-8 w-8 mx-auto text-green-700" />
                  <div className="mt-2 text-2xl font-bold text-gray-900">10%</div>
                  <div className="text-sm text-gray-600">SAF Mandate by 2030</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto text-green-700" />
                  <div className="mt-2 text-2xl font-bold text-gray-900">1.5B L</div>
                  <div className="text-sm text-gray-600">Annual SAF Demand</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Globe className="h-8 w-8 mx-auto text-green-700" />
                  <div className="mt-2 text-2xl font-bold text-gray-900">50%</div>
                  <div className="text-sm text-gray-600">Emissions Reduction</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Building2 className="h-8 w-8 mx-auto text-green-700" />
                  <div className="mt-2 text-2xl font-bold text-gray-900">$15B</div>
                  <div className="text-sm text-gray-600">Market Opportunity</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center">
            What We Do
          </h2>
          <p className="mt-4 text-gray-600 text-center max-w-2xl mx-auto">
            ABFI provides the infrastructure for Australia&apos;s bioenergy feedstock
            market through three core services.
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Target className="h-6 w-6 text-green-700" />
                </div>
                <CardTitle className="mt-4">ABFI Rating System</CardTitle>
                <CardDescription>
                  Standardised feedstock scoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Sustainability compliance (30%)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Carbon intensity rating (30%)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Quality specifications (25%)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Supply reliability (15%)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Users className="h-6 w-6 text-green-700" />
                </div>
                <CardTitle className="mt-4">Marketplace Platform</CardTitle>
                <CardDescription>
                  Connect suppliers and buyers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Searchable feedstock listings
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Verified supplier profiles
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Inquiry management system
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Transaction facilitation
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Shield className="h-6 w-6 text-green-700" />
                </div>
                <CardTitle className="mt-4">Verification Services</CardTitle>
                <CardDescription>
                  Trust through transparency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Certification validation
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Lab test verification
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Chain of custody tracking
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Compliance reporting
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-green-900 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mt-4 text-green-100">
            Join Australia&apos;s leading bioenergy feedstock platform and be part of
            the sustainable aviation revolution.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-amber-500 text-gray-900 hover:bg-amber-400"
              asChild
            >
              <Link href="/register?role=supplier">
                Register as Supplier
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-green-800"
              asChild
            >
              <Link href="/register?role=buyer">Register as Buyer</Link>
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
