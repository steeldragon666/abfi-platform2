/**
 * Unified PageLayout component that wraps pages with consistent header and footer.
 * Use this for all public-facing pages that need the standard ABFI layout.
 */
import { ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { PageFooter } from "./PageFooter";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: ReactNode;
  /** Whether to show the footer (default: true) */
  showFooter?: boolean;
  /** Header variant: default, transparent, or dark */
  headerVariant?: "default" | "transparent" | "dark";
  /** Additional class for the main content area */
  className?: string;
  /** Background class for the page */
  bgClassName?: string;
}

export function PageLayout({
  children,
  showFooter = true,
  headerVariant = "default",
  className,
  bgClassName = "bg-background",
}: PageLayoutProps) {
  return (
    <div className={cn("min-h-screen flex flex-col", bgClassName)}>
      <PageHeader variant={headerVariant} />
      <main className={cn("flex-1", className)}>{children}</main>
      {showFooter && <PageFooter />}
    </div>
  );
}

export default PageLayout;
