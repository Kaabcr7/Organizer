"use client";

import { motion, AnimatePresence } from "motion/react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";

export function LevelUpModal() {
  const { state, dismissLevelUp } = useApp();
  const { levelUpEvent } = state;

  return (
    <AnimatePresence>
      {levelUpEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-md"
          onClick={dismissLevelUp}
        >
          {/* Confetti-like background elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, y: "100%" }}
                animate={{ opacity: [0.5, 0.8, 0], y: "-100vh" }}
                transition={{
                  duration: 2 + i * 0.2,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  backgroundColor: "var(--xp-color)",
                  left: `${20 + i * 15}%`,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative mx-4 flex max-w-md flex-col items-center rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/80 p-8 shadow-2xl md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon container with pulse */}
            <motion.div
              initial={{ rotate: -30, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
              className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full md:h-28 md:w-28"
              style={{
                background: "linear-gradient(135deg, color-mix(in oklch, var(--level-color) 20%, transparent) 0%, color-mix(in oklch, var(--xp-color) 20%, transparent) 100%)",
              }}
            >
              {/* Outer glow */}
              <motion.div
                animate={{ boxShadow: ["0 0 20px var(--level-color)", "0 0 40px var(--level-color)"] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full"
              />

              {/* Inner icon */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Star
                  className="h-12 w-12 md:h-14 md:w-14"
                  style={{ color: "var(--level-color)" }}
                />
              </motion.div>

              {/* Sparkles */}
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5],
                    rotate: 360,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.3,
                    repeat: Infinity,
                  }}
                  className="absolute h-1 w-1 rounded-full"
                  style={{
                    backgroundColor: "var(--xp-color)",
                    top: `${20 + (i % 2) * 40}%`,
                    left: `${20 + Math.floor(i / 2) * 40}%`,
                  }}
                />
              ))}
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="relative z-10 text-center"
            >
              <motion.p
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                ✨ Level Up! ✨
              </motion.p>

              <motion.p
                className="mt-3 text-5xl font-black md:text-6xl"
                style={{ color: "var(--level-color)" }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  stiffness: 500,
                  damping: 20,
                }}
              >
                {levelUpEvent.newLevel}
              </motion.p>

              <motion.p
                className="mt-2 text-base font-semibold text-foreground md:text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                You&apos;ve reached Level {levelUpEvent.newLevel}
              </motion.p>

              <motion.p
                className="mt-3 text-sm text-muted-foreground max-w-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                You&apos;re making incredible progress. Keep this momentum going!
              </motion.p>
            </motion.div>

            {/* Button */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.2 }}
              className="relative z-10 mt-8"
            >
              <Button
                onClick={dismissLevelUp}
                size="lg"
                className="h-11 px-8 text-base font-semibold"
                style={{
                  backgroundColor: "var(--level-color)",
                  color: "white",
                }}
              >
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
