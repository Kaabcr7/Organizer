"use client";

import { Flame, Zap, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { getGreeting, formatToday } from "@/lib/domain/date";
import { getLevelProgress, formatXp } from "@/lib/domain/xp";
import { LEVEL_XP_TABLE } from "@/lib/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { UserStats } from "@/types/gamification";

// Index 0 of the table is an unused placeholder, so the last index is the
// highest reachable level.
const MAX_LEVEL = LEVEL_XP_TABLE.length - 1;

interface DailyHeaderProps {
  stats: UserStats;
  completionPercent: number;
}

export function DailyHeader({ stats, completionPercent }: DailyHeaderProps) {
  const greeting = getGreeting();
  const today = formatToday();
  const levelProgress = getLevelProgress(stats);
  const reducedMotion = useReducedMotion();
  const isMaxLevel = stats.level >= MAX_LEVEL;

  return (
    <div className="space-y-6">
      {/* Hero Greeting Section */}
      <div className="space-y-2">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {today}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="heading-premium text-3xl sm:text-4xl"
        >
          {greeting}
        </motion.h1>
      </div>

      {/* Daily Progress Hero */}
      <div className="surface-hero rounded-2xl p-6 md:p-8">
        <div className="space-y-4">
          {/* Large Progress Circle with Animation */}
          <div className="flex items-center gap-6">
            <div className="relative h-20 w-20 shrink-0">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted/30"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="201"
                  strokeDashoffset={201 - (completionPercent / 100) * 201}
                  strokeLinecap="round"
                  className="text-foreground transition-colors"
                  style={{ color: "var(--xp-color)" }}
                  initial={false}
                  animate={{ strokeDashoffset: 201 - (completionPercent / 100) * 201 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
                />
              </svg>
              <motion.span
                key={completionPercent}
                initial={{ scale: 1.1, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
                style={{ color: "var(--xp-color)" }}
              >
                {completionPercent}%
              </motion.span>
            </div>

            {/* Progress Info */}
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Daily Progress
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {stats.tasksCompletedToday} of{" "}
                  <span className="font-semibold text-foreground">
                    {stats.tasksCompletedToday + stats.tasksCompletedToday}
                  </span>{" "}
                  total tasks
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <div className="flex items-center gap-1.5 rounded-lg bg-background/50 px-3 py-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-foreground/60" />
                  <span className="text-xs font-medium">
                    Today&apos;s focus
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 gap-3 pt-2 md:grid-cols-3">
            {/* Streak */}
            <div className="rounded-lg bg-background/50 p-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4" style={{ color: "var(--streak-color)" }} />
                <div>
                  <p className="text-xs text-muted-foreground">Streak</p>
                  <motion.p
                    key={stats.currentStreak}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-bold"
                  >
                    {stats.currentStreak}
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Level */}
            <div className="rounded-lg bg-background/50 p-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: "var(--level-color)" }} />
                <div>
                  <p className="text-xs text-muted-foreground">Level</p>
                  <motion.p
                    key={stats.level}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-bold"
                  >
                    {stats.level}
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Total XP */}
            <div className="rounded-lg bg-background/50 p-3 col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: "var(--xp-color)" }} />
                <div>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                  <motion.p
                    key={stats.totalXp}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-bold"
                    style={{ color: "var(--xp-color)" }}
                  >
                    {formatXp(stats.totalXp)}
                  </motion.p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Level Progress Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Level {stats.level}</p>
            <p className="text-xs text-muted-foreground">
              {isMaxLevel
                ? "Max level reached"
                : stats.totalXp >= stats.xpForNextLevel
                  ? "Ready to level up"
                  : `${formatXp(
                      stats.xpForNextLevel - stats.totalXp
                    )} XP to level up`}
            </p>
          </div>
          <div className="text-right">
            {!isMaxLevel && (
              <p className="text-xs text-muted-foreground">
                Level {stats.level + 1}
              </p>
            )}
          </div>
        </div>
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Progress 
            value={levelProgress} 
            className="h-2"
            style={{ accentColor: "var(--level-color)" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
