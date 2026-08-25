"use client";

import { CalendarDays, CheckCircle2, XCircle, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";
import { CATEGORY_CONFIG } from "@/lib/constants";

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split("T")[0]) return "Today";
  if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function HistoryPage() {
  const { state } = useApp();
  const { history } = state;

  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(history).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div>
        <h1>History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your daily productivity record
        </p>
      </div>

      <Separator />

      {sortedDates.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No history yet. Complete tasks to build your record.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDates.map((date) => {
            const day = history[date];
            const completed = day.tasks.filter((t) => t.completed);
            const incomplete = day.tasks.filter((t) => !t.completed);

            return (
              <Card key={date} className="surface-elevated">
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatDateLabel(date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Zap className="h-3 w-3" style={{ color: "var(--xp-color)" }} />
                        {day.totalXpEarned} XP
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {day.completionPercentage}%
                      </Badge>
                    </div>
                  </div>

                  {/* Progress */}
                  <Progress
                    value={day.completionPercentage}
                    className="mt-3 h-1.5"
                  />

                  {/* Task summary */}
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-foreground/60" />
                      {completed.length} done
                    </span>
                    {incomplete.length > 0 && (
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-muted-foreground" />
                        {incomplete.length} missed
                      </span>
                    )}
                    <span>{day.tasks.length} total</span>
                  </div>

                  {/* Task details — collapsed by default, show first few */}
                  {day.tasks.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-border pt-2">
                      {day.tasks.slice(0, 5).map((task) => {
                        const cat = CATEGORY_CONFIG[task.category];
                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="h-3 w-3 shrink-0 text-foreground/50" />
                            ) : (
                              <XCircle className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                            )}
                            <span
                              className={
                                task.completed
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground"
                              }
                            >
                              {task.title}
                            </span>
                            <span
                              className="ml-auto text-[10px]"
                              style={{ color: cat.color }}
                            >
                              {cat.label}
                            </span>
                          </div>
                        );
                      })}
                      {day.tasks.length > 5 && (
                        <p className="text-[10px] text-muted-foreground">
                          +{day.tasks.length - 5} more
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
