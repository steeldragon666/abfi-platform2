import Link from "next/link";
import { Leaf } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1B4332] text-white p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4A853] rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-[#1B4332]" />
            </div>
            <span className="text-2xl font-bold">ABFI</span>
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Australia&apos;s National Feedstock Coordination Platform
          </h1>
          <p className="text-lg text-white/80">
            Connect with verified feedstock suppliers and bioenergy producers
            through standardised ratings and transparent marketplace
            functionality.
          </p>
          <div className="grid grid-cols-2 gap-6 pt-6">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#D4A853]">$10B+</div>
              <div className="text-sm text-white/70">Annual Market Opportunity</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#D4A853]">$1.1B</div>
              <div className="text-sm text-white/70">Government Investment</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#D4A853]">50%</div>
              <div className="text-sm text-white/70">Suppliers Seeking Demand</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#D4A853]">100+</div>
              <div className="text-sm text-white/70">Feedstock Types</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-white/60">
          &copy; {new Date().getFullYear()} Australian Bioenergy Feedstock Institute.
          All rights reserved.
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
