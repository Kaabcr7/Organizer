"use client";

import { Flame, Zap, Trophy, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/lib/store";
import { getLevelProgress, formatXp } from "@/lib/domain/xp";
import { CategoryChart } from "@/components/stats/category-chart";
import { WeeklyChart } from "@/components/stats/weekly-chart";

export default function StatsPage() {
  const { state } = useApp();
  const { stats, achievements, tasks, history } = state;
  const levelProgress = getLevelProgress(stats);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Statistics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your productivity journey at a glance
        </p>
      </div>

      <Separator />

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: "var(--xp-color)" }} />
              <span className="text-xs text-muted-foreground">Total XP</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatXp(stats.totalXp)}</p>
          </CardContent>
        </Card>

        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" style={{ color: "var(--level-color)" }} />
              <span className="text-xs text-muted-foreground">Level</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.level}</p>
          </CardContent>
        </Card>

        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4" style={{ color: "var(--streak-color)" }} />
              <span className="text-xs text-muted-foreground">Streak</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.currentStreak}</p>
            <p className="text-[10px] text-muted-foreground">
              Best: {stats.longestStreak}
            </p>
          </CardContent>
        </Card>

        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.tasksCompletedTotal}</p>
            <p className="text-[10px] text-muted-foreground">tasks total</p>
          </CardContent>
        </Card>
      </div>

      {/* Level progress */}
      <Card className="surface-elevated">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Level Progress</h3>
            <span className="text-xs text-muted-foreground">{levelProgress}%</span>
          </div>
          <Progress value={levelProgress} className="mt-3 h-2" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Lv. {stats.level} — {formatXp(stats.xpForCurrentLevel)} XP</span>
            <span>Lv. {stats.level + 1} — {formatXp(stats.xpForNextLevel)} XP</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryChart tasks={tasks} />
        <WeeklyChart history={history} />
      </div>

      {/* Achievements */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Achievements</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                ach.isUnlocked ? "border-border" : "border-border/50 opacity-50"
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm">
                {ach.isUnlocked ? "✓" : "?"}
              </div>
              <div>
                <p className="text-sm font-medium">{ach.title}</p>
                <p className="text-xs text-muted-foreground">{ach.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
