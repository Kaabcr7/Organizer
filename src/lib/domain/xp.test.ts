import { describe, it, expect } from "vitest";
import { getLevelFromXp, getLevelProgress, formatXp } from "./xp";
import type { UserStats } from "@/types/gamification";

describe("getLevelFromXp", () => {
  it("returns level 1 for 0 XP", () => {
    expect(getLevelFromXp(0)).toBe(1);
  });

  it("returns level 2 at 100 XP", () => {
    expect(getLevelFromXp(100)).toBe(2);
  });

  it("returns level 2 at 249 XP (just below level 3)", () => {
    expect(getLevelFromXp(249)).toBe(2);
  });

  it("returns level 3 at 250 XP", () => {
    expect(getLevelFromXp(250)).toBe(3);
  });

  it("returns level 6 at 1300 XP", () => {
    expect(getLevelFromXp(1300)).toBe(6);
  });

  it("returns level 6 at 1420 XP (mock stats)", () => {
    expect(getLevelFromXp(1420)).toBe(6);
  });

  it("returns level 10 at 4600 XP", () => {
    expect(getLevelFromXp(4600)).toBe(10);
  });
});

describe("getLevelProgress", () => {
  it("calculates progress within a level", () => {
    const stats: UserStats = {
      totalXp: 1420,
      level: 6,
      xpForCurrentLevel: 1300,
      xpForNextLevel: 1900,
      currentStreak: 5,
      longestStreak: 10,
      tasksCompletedToday: 2,
      tasksCompletedTotal: 50,
    };
    // (1420 - 1300) / (1900 - 1300) = 120/600 = 20%
    expect(getLevelProgress(stats)).toBe(20);
  });

  it("returns 0% at the start of a level", () => {
    const stats: UserStats = {
      totalXp: 1300,
      level: 6,
      xpForCurrentLevel: 1300,
      xpForNextLevel: 1900,
      currentStreak: 0,
      longestStreak: 0,
      tasksCompletedToday: 0,
      tasksCompletedTotal: 0,
    };
    expect(getLevelProgress(stats)).toBe(0);
  });
});

describe("formatXp", () => {
  it("formats small numbers normally", () => {
    expect(formatXp(500)).toBe("500");
  });

  it("formats 10000+ with k suffix", () => {
    expect(formatXp(12345)).toBe("12.3k");
  });

  it("formats with locale separators under 10k", () => {
    expect(formatXp(9999)).toBe("9,999");
  });
});
