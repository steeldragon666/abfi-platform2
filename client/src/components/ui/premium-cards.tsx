/**
 * Premium Card Components - Enhanced UI with glass morphism and animations
 * Designed for the ABFI platform's premium financial interface
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode, forwardRef } from "react";
import { LucideIcon } from "lucide-react";

// ============================================
// Glass Card - Frosted glass effect
// ============================================
interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "none" | "subtle" | "primary" | "gold" | "success";
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hover = true, glow = "none" }, ref) => {
    const glowStyles = {
      none: "",
      subtle: "shadow-[0_0_20px_rgba(0,0,0,0.05)]",
      primary: "shadow-[0_0_30px_rgba(13,148,136,0.15)]",
      gold: "shadow-[0_0_30px_rgba(212,175,55,0.15)]",
      success: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
        className={cn(
          "relative rounded-2xl border border-white/20",
          "bg-white/80 backdrop-blur-xl",
          "dark:bg-slate-900/80 dark:border-white/10",
          hover && "transition-shadow duration-300 hover:shadow-xl",
          glowStyles[glow],
          className
        )}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";

// ============================================
// Gradient Border Card
// ============================================
interface GradientBorderCardProps {
  children: ReactNode;
  className?: string;
  gradient?: "primary" | "gold" | "success" | "rainbow";
}

export function GradientBorderCard({
  children,
  className,
  gradient = "primary",
}: GradientBorderCardProps) {
  const gradientStyles = {
    primary: "from-teal-400 via-teal-500 to-teal-600",
    gold: "from-amber-400 via-yellow-500 to-orange-400",
    success: "from-emerald-400 via-green-500 to-teal-500",
    rainbow: "from-pink-500 via-purple-500 to-indigo-500",
  };

  return (
    <div className={cn("relative p-[1px] rounded-2xl", className)}>
      <div
        className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-75",
          gradientStyles[gradient]
        )}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl">
        {children}
      </div>
    </div>
  );
}

// ============================================
// Stats Card Premium - Enhanced stats display
// ============================================
interface StatsCardPremiumProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "info" | "gold";
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  description?: string;
  animated?: boolean;
}

export function StatsCardPremium({
  title,
  value,
  icon: Icon,
  variant = "default",
  trend,
  description,
  animated = true,
}: StatsCardPremiumProps) {
  const variantStyles = {
    default: {
      bg: "bg-white",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      accentBorder: "border-l-slate-400",
    },
    success: {
      bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      accentBorder: "border-l-emerald-500",
    },
    warning: {
      bg: "bg-gradient-to-br from-amber-50 to-orange-50",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      accentBorder: "border-l-amber-500",
    },
    info: {
      bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      accentBorder: "border-l-blue-500",
    },
    gold: {
      bg: "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50",
      iconBg: "bg-gradient-to-br from-amber-200 to-yellow-300",
      iconColor: "text-amber-700",
      accentBorder: "border-l-amber-400",
    },
  };

  const styles = variantStyles[variant];

  const trendColors = {
    up: "text-emerald-600 bg-emerald-50",
    down: "text-red-600 bg-red-50",
    neutral: "text-slate-500 bg-slate-50",
  };

  const Wrapper = animated ? motion.div : "div";
  const wrapperProps = animated
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
        whileHover: { y: -2, transition: { duration: 0.2 } },
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "relative rounded-xl border border-l-4 p-5 transition-shadow hover:shadow-lg",
        styles.bg,
        styles.accentBorder
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight font-mono">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-2",
                trendColors[trend.direction]
              )}
            >
              {trend.direction === "up" && "↑"}
              {trend.direction === "down" && "↓"}
              {trend.direction === "neutral" && "→"}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", styles.iconBg)}>
          <Icon className={cn("h-6 w-6", styles.iconColor)} />
        </div>
      </div>
    </Wrapper>
  );
}

// ============================================
// Feature Card - For feature highlights
// ============================================
interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  onClick?: () => void;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  onClick,
}: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl border border-slate-200 bg-white p-6",
        "transition-all duration-300 hover:shadow-xl hover:border-teal-200",
        "dark:bg-slate-900 dark:border-slate-700 dark:hover:border-teal-600",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative">
        <div className="mb-4 inline-flex p-3 rounded-xl bg-slate-100 group-hover:bg-teal-100 transition-colors duration-300">
          <Icon className="h-6 w-6 text-slate-600 group-hover:text-teal-600 transition-colors duration-300" />
        </div>
        <h3 className="text-lg font-semibold mb-2 group-hover:text-teal-700 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================
// Metric Card - For displaying key metrics
// ============================================
interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "highlight" | "muted";
}

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  size = "md",
  variant = "default",
}: MetricCardProps) {
  const sizeStyles = {
    sm: {
      padding: "p-3",
      labelSize: "text-xs",
      valueSize: "text-xl",
    },
    md: {
      padding: "p-4",
      labelSize: "text-sm",
      valueSize: "text-2xl",
    },
    lg: {
      padding: "p-6",
      labelSize: "text-sm",
      valueSize: "text-4xl",
    },
  };

  const variantStyles = {
    default: "bg-slate-50 border-slate-200",
    highlight: "bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200",
    muted: "bg-slate-100/50 border-slate-100",
  };

  return (
    <div
      className={cn(
        "rounded-xl border text-center",
        sizeStyles[size].padding,
        variantStyles[variant]
      )}
    >
      {Icon && (
        <div className="flex justify-center mb-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <p className={cn("text-muted-foreground mb-1", sizeStyles[size].labelSize)}>
        {label}
      </p>
      <p
        className={cn(
          "font-bold font-mono tracking-tight",
          sizeStyles[size].valueSize
        )}
      >
        {value}
        {unit && (
          <span className="text-muted-foreground font-normal text-base ml-1">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

// ============================================
// Action Card - For quick actions
// ============================================
interface ActionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "gold";
  disabled?: boolean;
}

export function ActionCard({
  icon: Icon,
  label,
  description,
  onClick,
  variant = "default",
  disabled = false,
}: ActionCardProps) {
  const variantStyles = {
    default: "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    primary: "border-teal-200 bg-teal-50 hover:bg-teal-100 hover:border-teal-300",
    gold: "border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300",
  };

  const iconStyles = {
    default: "bg-slate-100 text-slate-600",
    primary: "bg-teal-100 text-teal-600",
    gold: "bg-amber-100 text-amber-600",
  };

  return (
    <motion.button
      whileHover={!disabled ? { y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
        variantStyles[variant],
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cn("p-2 rounded-lg", iconStyles[variant])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-left">
        <p className="font-medium">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </motion.button>
  );
}

// ============================================
// Status Indicator - Animated status dot
// ============================================
interface StatusIndicatorProps {
  status: "active" | "pending" | "inactive" | "error";
  label?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export function StatusIndicator({
  status,
  label,
  size = "md",
  pulse = true,
}: StatusIndicatorProps) {
  const statusStyles = {
    active: "bg-emerald-500",
    pending: "bg-amber-500",
    inactive: "bg-slate-400",
    error: "bg-red-500",
  };

  const sizeStyles = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex">
        <span
          className={cn(
            "rounded-full",
            sizeStyles[size],
            statusStyles[status]
          )}
        />
        {pulse && status === "active" && (
          <span
            className={cn(
              "absolute inline-flex rounded-full opacity-75 animate-ping",
              sizeStyles[size],
              statusStyles[status]
            )}
          />
        )}
      </span>
      {label && (
        <span className="text-sm text-muted-foreground capitalize">{label}</span>
      )}
    </div>
  );
}

// ============================================
// Progress Ring - Circular progress indicator
// ============================================
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: "primary" | "gold" | "success";
  showValue?: boolean;
  label?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = "primary",
  showValue = true,
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorStyles = {
    primary: "stroke-teal-500",
    gold: "stroke-amber-500",
    success: "stroke-emerald-500",
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colorStyles[color]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold font-mono">{progress}%</span>
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}
