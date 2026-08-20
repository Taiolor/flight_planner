import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ContentRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: "none" | "short" | "medium" | "long";
};

const delayClasses = {
  none: "",
  short: "delay-75",
  medium: "delay-100",
  long: "delay-150",
} as const;

/** Revela conteúdo após skeleton/loading sem forçar movimento para quem o reduziu. */
export function ContentReveal({ children, className, delay = "none" }: ContentRevealProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in duration-500 motion-reduce:animate-none",
        delayClasses[delay],
        className
      )}
    >
      {children}
    </div>
  );
}
