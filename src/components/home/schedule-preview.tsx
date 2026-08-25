"use client";

import { Clock, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/domain/schedule";
import { SCHEDULE_BLOCK_CONFIG } from "@/lib/constants";
import type { DaySchedule } from "@/types/schedule";

interface SchedulePreviewProps {
  schedule: DaySchedule;
}

export function SchedulePreview({ schedule }: SchedulePreviewProps) {
  // Helper to convert HH:MM to minutes
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  // Find current time and nearby blocks
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const currentBlock = schedule.blocks.find(
    (b) => timeToMinutes(b.startTime) <= currentMinutes && currentMinutes < timeToMinutes(b.endTime)
  );
  
  const nextBlock = schedule.blocks.find(
    (b) => timeToMinutes(b.startTime) > currentMinutes
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Today&apos;s Schedule</h2>
        {schedule.isTeachingDay && (
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-lg px-2.5 py-1 text-[10px] font-semibold"
            style={{
              color: "var(--cat-teaching)",
              background: "color-mix(in oklch, var(--cat-teaching) 12%, transparent)",
              border: "1px solid var(--cat-teaching)",
            }}
          >
            Teaching Day
          </motion.span>
        )}
      </div>

      {/* Current/Next block highlight */}
      {currentBlock && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border/50 bg-foreground/5 p-3"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full animate-pulse-soft"
              style={{ backgroundColor: SCHEDULE_BLOCK_CONFIG[currentBlock.type].color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Now</p>
              <p className="text-sm font-semibold truncate">{currentBlock.title}</p>
            </div>
          </div>
        </motion.div>
      )}

      {nextBlock && !currentBlock && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border/50 bg-foreground/5 p-3"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: SCHEDULE_BLOCK_CONFIG[nextBlock.type].color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Next</p>
              <p className="text-sm font-semibold truncate">{nextBlock.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(nextBlock.startTime)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {!currentBlock && !nextBlock && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border/50 bg-foreground/5 p-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                No upcoming commitments
              </p>
              <p className="text-sm text-foreground font-medium">Free time available</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="relative space-y-2">
        {/* Timeline line */}
        <div className="absolute left-[7px] top-0 bottom-0 w-px bg-gradient-to-b from-border to-border/50" />

        {schedule.blocks.map((block, index) => {
          const config = SCHEDULE_BLOCK_CONFIG[block.type];
          const isCurrent = currentBlock?.id === block.id;
          const isNext = nextBlock?.id === block.id && !currentBlock;

          return (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "relative flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                isCurrent && "bg-foreground/10 border border-foreground/20",
                isNext && "bg-foreground/5 border border-foreground/10",
                !isCurrent && !isNext && "hover:bg-foreground/5"
              )}
            >
              {/* Timeline dot */}
              <motion.div
                animate={isCurrent ? { scale: [1, 1.1, 1] } : undefined}
                transition={isCurrent ? { duration: 2, repeat: Infinity } : undefined}
                className={cn(
                  "relative z-10 mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                  isCurrent && "ring-2 ring-offset-2",
                )}
                style={{
                  borderColor: config.color,
                  backgroundColor: `color-mix(in oklch, ${config.color} 25%, transparent)`,
                  ...(isCurrent && {
                    outlineWidth: '2px',
                    outlineStyle: 'solid' as const,
                    outlineOffset: '2px',
                    outlineColor: config.color,
                  }),
                }}
              >
                {isCurrent && (
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                )}
              </motion.div>

              {/* Block content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium" style={{ color: config.color }}>
                    {block.title}
                  </p>
                  {block.isFixed && (
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
                      Fixed
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  {formatTime(block.startTime)} – {formatTime(block.endTime)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
