"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap } from "lucide-react";
import { useApp } from "@/lib/store";

const XP_TOAST_DURATION = 3000;

export function XpToast() {
  const { state, dismissXpAnimation } = useApp();
  const { xpAnimations } = state;

  // Auto-dismiss after duration
  useEffect(() => {
    if (xpAnimations.length === 0) return;
    const latest = xpAnimations[xpAnimations.length - 1];
    const timer = setTimeout(() => {
      dismissXpAnimation(latest.id);
    }, XP_TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [xpAnimations, dismissXpAnimation]);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3 md:bottom-8 md:right-8">
      <AnimatePresence mode="popLayout">
        {xpAnimations.map((anim, index) => (
          <motion.div
            key={anim.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.85, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.8, x: 20 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              delay: index * 0.05,
            }}
            className="pointer-events-auto flex items-center gap-3 rounded-lg border border-border/60 bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm"
          >
            {/* Animated icon */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 25,
              }}
              className="flex shrink-0 items-center justify-center"
            >
              <div className="relative">
                <Zap
                  className="h-5 w-5"
                  style={{ color: "var(--xp-color)" }}
                />
                {/* Shimmer effect */}
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 rounded-full blur-sm"
                  style={{
                    boxShadow: "0 0 8px var(--xp-color)",
                  }}
                />
              </div>
            </motion.div>

            {/* Content */}
            <div className="flex flex-col gap-0.5">
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 600,
                  damping: 25,
                  delay: 0.1,
                }}
                className="flex items-baseline gap-1"
              >
                <span
                  className="text-sm font-bold tracking-tight"
                  style={{ color: "var(--xp-color)" }}
                >
                  +{anim.amount}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  XP
                </span>
              </motion.div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-xs text-muted-foreground line-clamp-1"
              >
                {anim.taskTitle}
              </motion.span>
            </div>

            {/* Close button */}
            <button
              onClick={() => dismissXpAnimation(anim.id)}
              className="ml-2 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
