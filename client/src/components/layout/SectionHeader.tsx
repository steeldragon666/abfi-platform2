/**
 * SectionHeader - Consistent section header with title, description, and optional badge.
 */
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SectionHeaderProps {
  /** Optional badge text above the title */
  badge?: string;
  /** Main title */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Alignment */
  align?: "left" | "center";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
  /** Optional action button on the right */
  action?: ReactNode;
}

export function SectionHeader({
  badge,
  title,
  description,
  align = "left",
  size = "md",
  className,
  action,
}: SectionHeaderProps) {
  const titleSizes = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl lg:text-4xl",
    lg: "text-3xl md:text-4xl lg:text-5xl",
  };

  const descriptionSizes = {
    sm: "text-sm",
    md: "text-base lg:text-lg",
    lg: "text-lg lg:text-xl",
  };

  return (
    <div
      className={cn(
        "mb-8 lg:mb-12",
        align === "center" && "text-center",
        action && "flex items-start justify-between gap-4",
        className
      )}
    >
      <div className={cn(align === "center" && "mx-auto", action && "flex-1")}>
        {badge && (
          <Badge variant="outline" className="mb-3">
            {badge}
          </Badge>
        )}
        <h2
          className={cn(
            "font-display font-bold text-foreground mb-3",
            titleSizes[size]
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "text-muted-foreground",
              descriptionSizes[size],
              align === "center" && "max-w-2xl mx-auto"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default SectionHeader;
