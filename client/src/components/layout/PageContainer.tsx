/**
 * PageContainer - Consistent content wrapper with max-width and padding.
 * Use this inside PageLayout for content sections.
 */
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  /** Size variant for max-width */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Additional className */
  className?: string;
  /** Padding variant */
  padding?: "none" | "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

const paddingClasses = {
  none: "",
  sm: "py-8",
  md: "py-12 lg:py-16",
  lg: "py-16 lg:py-24",
};

export function PageContainer({
  children,
  size = "lg",
  className,
  padding = "md",
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "container mx-auto px-4",
        sizeClasses[size],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export default PageContainer;
