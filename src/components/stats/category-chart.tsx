"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORY_CONFIG } from "@/lib/constants";
import type { Task } from "@/types/task";

interface CategoryChartProps {
  tasks: Task[];
}

export function CategoryChart({ tasks }: CategoryChartProps) {
  const categoryCount = tasks.reduce(
    (acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const data = Object.entries(categoryCount).map(([category, count]) => ({
    name: CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.label ?? category,
    value: count,
    color: CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.color ?? "var(--muted)",
  }));

  if (data.length === 0) {
    return (
      <Card className="surface-elevated">
        <CardContent className="flex h-48 items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">No tasks yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="surface-elevated">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-medium">Task Categories</h3>
        <div className="flex items-center gap-4">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 overflow-hidden">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-xs text-muted-foreground">
                  {item.name}
                </span>
                <span className="text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
