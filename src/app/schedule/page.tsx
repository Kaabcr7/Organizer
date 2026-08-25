"use client";

import { Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";
import { formatTime, getBlockDuration, getCurrentBlock, getNextBlock } from "@/lib/domain/schedule";
import { SCHEDULE_BLOCK_CONFIG } from "@/lib/constants";
import { formatToday } from "@/lib/domain/date";

export default function SchedulePage() {
  const { state } = useApp();
  const { schedule } = state;
  const today = formatToday();
  const currentBlock = getCurrentBlock(schedule.blocks);
  const nextBlock = getNextBlock(schedule.blocks);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">{today}</p>
        {schedule.isTeachingDay && (
          <span
            className="mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-medium"
            style={{
              color: "var(--cat-teaching)",
              background: "color-mix(in oklch, var(--cat-teaching) 10%, transparent)",
            }}
          >
            Teaching Day — limited evening availability
          </span>
        )}
      </div>

      <Separator />

      {/* Current + Next block summary */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Now
          </p>
          {currentBlock ? (
            <p
              className="mt-1 text-sm font-semibold"
              style={{ color: SCHEDULE_BLOCK_CONFIG[currentBlock.type].color }}
            >
              {currentBlock.title}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Free time</p>
          )}
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Next
          </p>
          {nextBlock ? (
            <div className="mt-1">
              <p
                className="text-sm font-semibold"
                style={{ color: SCHEDULE_BLOCK_CONFIG[nextBlock.type].color }}
              >
                {nextBlock.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(nextBlock.startTime)}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Nothing scheduled</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {schedule.blocks.map((block) => {
          const config = SCHEDULE_BLOCK_CONFIG[block.type];
          const duration = getBlockDuration(block.startTime, block.endTime);
          const isCurrent = currentBlock?.id === block.id;

          return (
            <div key={block.id} className="group relative flex">
              {/* Time column */}
              <div className="w-20 shrink-0 py-4 pr-4 text-right">
                <p className="text-xs font-medium text-muted-foreground">
                  {formatTime(block.startTime)}
                </p>
              </div>

              {/* Timeline spine */}
              <div className="relative flex w-8 flex-col items-center">
                <div className="h-4 w-px bg-border" />
                <div
                  className="h-3 w-3 rounded-full border-2"
                  style={{
                    borderColor: config.color,
                    backgroundColor: isCurrent
                      ? config.color
                      : `color-mix(in oklch, ${config.color} 20%, transparent)`,
                  }}
                />
                <div className="w-px flex-1 bg-border" />
              </div>

              {/* Block card */}
              <div className="flex-1 py-2">
                <div
                  className="rounded-lg border px-4 py-3 transition-colors"
                  style={{
                    borderColor: isCurrent
                      ? config.color
                      : `color-mix(in oklch, ${config.color} 25%, var(--border))`,
                    background: isCurrent
                      ? `color-mix(in oklch, ${config.color} 8%, var(--card))`
                      : `color-mix(in oklch, ${config.color} 4%, var(--card))`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: config.color }}>
                        {block.title}
                      </p>
                      {isCurrent && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          Now
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {duration}m
                    </div>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatTime(block.startTime)} – {formatTime(block.endTime)}
                    {block.isFixed && " · Fixed"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
