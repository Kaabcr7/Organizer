"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { HistoricalDay } from "@/lib/store";

interface WeeklyChartProps {
  history: Record<string, HistoricalDay>;
}

export function WeeklyChart({ history }: WeeklyChartProps) {
  // Generate last 7 days of data
  const data = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split("T")[0];
    const day = history[dateStr];
    const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });

    return {
      day: dayLabel,
      completion: day?.completionPercentage ?? 0,
      xp: day?.totalXpEarned ?? 0,
    };
  });

  return (
    <Card className="surface-elevated">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-medium">Weekly Completion</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={20}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                hide
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${value}%`, "Completion"]}
              />
              <Bar
                dataKey="completion"
                fill="var(--foreground)"
                opacity={0.7}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
