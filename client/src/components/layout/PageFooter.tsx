/**
 * Unified PageFooter component for consistent footer across the platform.
 */
import { Leaf, Lock, Shield } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export function PageFooter() {
  return (
    <footer className="border-t bg-slate-900 text-slate-300 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold font-display text-white">ABFI</span>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-sm">
              Australian Bioenergy Feedstock Institute — Bank-grade infrastructure
              for biomass supply chain management and project finance.
            </p>
            <div className="flex gap-3">
              <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                <Lock className="h-3 w-3 mr-1" />
                SOC 2
              </Badge>
              <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                ISO 27001
              </Badge>
            </div>
          </div>

          {/* For Growers */}
          <div>
            <h3 className="font-semibold mb-4 text-white">For Growers</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/producer-registration" className="hover:text-white transition-colors">
                  Register Supply
                </Link>
              </li>
              <li>
                <Link href="/supplier/futures" className="hover:text-white transition-colors">
                  List Futures
                </Link>
              </li>
              <li>
                <Link href="/for-growers" className="hover:text-white transition-colors">
                  Grower Benefits
                </Link>
              </li>
            </ul>
          </div>

          {/* For Developers */}
          <div>
            <h3 className="font-semibold mb-4 text-white">For Developers</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/futures" className="hover:text-white transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/bankability" className="hover:text-white transition-colors">
                  Bankability
                </Link>
              </li>
              <li>
                <Link href="/for-developers" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/feedstock-map" className="hover:text-white transition-colors">
                  Supply Map
                </Link>
              </li>
            </ul>
          </div>

          {/* For Lenders */}
          <div>
            <h3 className="font-semibold mb-4 text-white">For Lenders</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/lender-portal" className="hover:text-white transition-colors">
                  Lender Portal
                </Link>
              </li>
              <li>
                <Link href="/compliance-dashboard" className="hover:text-white transition-colors">
                  Compliance
                </Link>
              </li>
              <li>
                <Link href="/for-lenders" className="hover:text-white transition-colors">
                  Risk Framework
                </Link>
              </li>
              <li>
                <Link href="/platform-features" className="hover:text-white transition-colors">
                  Platform Features
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Australian Bioenergy Feedstock Institute. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/security" className="hover:text-white transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PageFooter;
