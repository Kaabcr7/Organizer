import type { DaySchedule, ScheduleBlock } from "@/types/schedule";
import { TEACHING_DAYS } from "@/lib/constants";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getDayOfWeek(): number {
  return new Date().getDay();
}

export function getMockSchedule(): DaySchedule {
  const today = getToday();
  const dayOfWeek = getDayOfWeek();
  const isTeachingDay = (TEACHING_DAYS as readonly number[]).includes(dayOfWeek);

  const blocks: ScheduleBlock[] = [
    {
      id: "block-1",
      title: "College",
      type: "college",
      startTime: "09:00",
      endTime: "17:00",
      isFixed: true,
    },
  ];

  if (isTeachingDay) {
    blocks.push({
      id: "block-2",
      title: "Teaching",
      type: "teaching",
      startTime: "17:30",
      endTime: "21:30",
      isFixed: true,
    });
    blocks.push({
      id: "block-3",
      title: "DSA Practice",
      type: "dsa",
      startTime: "06:30",
      endTime: "07:30",
      isFixed: false,
    });
    blocks.push({
      id: "block-4",
      title: "Wind down",
      type: "personal",
      startTime: "22:00",
      endTime: "23:00",
      isFixed: false,
    });
  } else {
    blocks.push({
      id: "block-5",
      title: "DSA Practice",
      type: "dsa",
      startTime: "06:30",
      endTime: "08:00",
      isFixed: false,
    });
    blocks.push({
      id: "block-6",
      title: "ML Project",
      type: "ml-ai",
      startTime: "17:30",
      endTime: "19:30",
      isFixed: false,
    });
    blocks.push({
      id: "block-7",
      title: "Workout",
      type: "fitness",
      startTime: "19:30",
      endTime: "20:15",
      isFixed: false,
    });
    blocks.push({
      id: "block-8",
      title: "Personal Projects",
      type: "projects",
      startTime: "20:30",
      endTime: "22:00",
      isFixed: false,
    });
    blocks.push({
      id: "block-9",
      title: "Reading",
      type: "personal",
      startTime: "22:00",
      endTime: "23:00",
      isFixed: false,
    });
  }

  // Sort by start time
  blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return { date: today, isTeachingDay, blocks };
}
