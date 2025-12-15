/**
 * Unified PageHeader component for consistent navigation across the platform.
 * Use this for all public-facing pages.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  Leaf,
  Menu,
  X,
  ChevronDown,
  TreeDeciduous,
  Building2,
  Banknote,
  Map,
  BarChart3,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const marketplaceItems: NavItem[] = [
  { label: "Futures Marketplace", href: "/futures", icon: TrendingUp, description: "Browse long-term supply contracts" },
  { label: "Demand Signals", href: "/demand-signals", icon: BarChart3, description: "View buyer requirements" },
  { label: "Browse Feedstocks", href: "/browse", icon: TreeDeciduous, description: "Explore available biomass" },
];

const resourcesItems: NavItem[] = [
  { label: "For Growers", href: "/for-growers", icon: TreeDeciduous, description: "Benefits for producers" },
  { label: "For Developers", href: "/for-developers", icon: Building2, description: "Project development tools" },
  { label: "For Lenders", href: "/for-lenders", icon: Banknote, description: "Risk assessment framework" },
  { label: "Platform Features", href: "/platform-features", icon: FileText, description: "Full feature overview" },
];

interface PageHeaderProps {
  variant?: "default" | "transparent" | "dark";
  className?: string;
}

export function PageHeader({ variant = "default", className }: PageHeaderProps) {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  const headerClasses = cn(
    "border-b sticky top-0 z-50 backdrop-blur-md",
    {
      "bg-background/95": variant === "default",
      "bg-transparent border-transparent": variant === "transparent",
      "bg-slate-900/95 border-slate-800": variant === "dark",
    },
    className
  );

  const textClasses = cn({
    "text-foreground": variant === "default",
    "text-white": variant === "transparent" || variant === "dark",
  });

  const mutedClasses = cn({
    "text-muted-foreground": variant === "default",
    "text-white/70": variant === "transparent" || variant === "dark",
  });

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className={cn(
              "p-2 rounded-xl transition-colors",
              variant === "default" ? "bg-primary/10 group-hover:bg-primary/20" : "bg-white/10 group-hover:bg-white/20"
            )}>
              <Leaf className={cn("h-6 w-6", variant === "default" ? "text-primary" : "text-white")} />
            </div>
            <div className="flex flex-col">
              <span className={cn("text-xl font-bold font-display", textClasses)}>ABFI</span>
              <span className={cn("text-[10px] -mt-1 hidden sm:block", mutedClasses)}>
                Bank-Grade Infrastructure
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Marketplace Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1",
                  isActive("/futures") || isActive("/demand-signals") || isActive("/browse")
                    ? "bg-primary/10 text-primary"
                    : ""
                )}
              >
                Marketplace
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Browse Supply</DropdownMenuLabel>
              {marketplaceItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="cursor-pointer">
                    <div className="flex items-start gap-3 py-1">
                      {item.icon && <item.icon className="h-4 w-4 mt-0.5 text-primary" />}
                      <div>
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/bankability">
            <Button
              variant="ghost"
              size="sm"
              className={isActive("/bankability") ? "bg-primary/10 text-primary" : ""}
            >
              Bankability
            </Button>
          </Link>

          <Link href="/feedstock-map">
            <Button
              variant="ghost"
              size="sm"
              className={isActive("/feedstock-map") ? "bg-primary/10 text-primary" : ""}
            >
              <Map className="h-4 w-4 mr-1" />
              Map
            </Button>
          </Link>

          {/* Resources Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                Resources
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Learn More</DropdownMenuLabel>
              {resourcesItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="cursor-pointer">
                    <div className="flex items-start gap-3 py-1">
                      {item.icon && <item.icon className="h-4 w-4 mt-0.5 text-primary" />}
                      <div>
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-border mx-2" />

          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm">
                Dashboard
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="sm">
                Sign In
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </a>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-accent/50 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className={cn("h-6 w-6", textClasses)} />
          ) : (
            <Menu className={cn("h-6 w-6", textClasses)} />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t bg-background overflow-hidden"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                Marketplace
              </div>
              {marketplaceItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive(item.href) ? "bg-primary/10 text-primary" : ""
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </Button>
                </Link>
              ))}

              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mt-2">
                Platform
              </div>
              <Link href="/bankability">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive("/bankability") ? "bg-primary/10 text-primary" : ""
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BarChart3 className="h-4 w-4" />
                  Bankability
                </Button>
              </Link>
              <Link href="/feedstock-map">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive("/feedstock-map") ? "bg-primary/10 text-primary" : ""
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Map className="h-4 w-4" />
                  Map
                </Button>
              </Link>

              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mt-2">
                Resources
              </div>
              {resourcesItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </Button>
                </Link>
              ))}

              <div className="border-t mt-4 pt-4">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button className="w-full" onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button className="w-full">
                      Sign In
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </a>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default PageHeader;
