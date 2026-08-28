/**
 * Seed achievements into Neon PostgreSQL
 * Run: DATABASE_URL=... npx tsx scripts/seed-achievements.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { randomUUID } from "crypto";
import * as schema from "../src/lib/db/schema";
import { achievements } from "../src/lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const ACHIEVEMENTS = [
  {
    title: "First Steps",
    description: "Complete your first task",
    icon: "🦶",
    sort_order: 1,
  },
  {
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    sort_order: 2,
  },
  {
    title: "Centurion",
    description: "Complete 100 tasks total",
    icon: "🏆",
    sort_order: 3,
  },
  {
    title: "Level 10",
    description: "Reach level 10",
    icon: "⭐",
    sort_order: 4,
  },
  {
    title: "Perfect Day",
    description: "Complete all tasks in a single day",
    icon: "👑",
    sort_order: 5,
  },
  {
    title: "Iron Discipline",
    description: "Maintain a 30-day streak",
    icon: "🛡️",
    sort_order: 6,
  },
  {
    title: "Speed Demon",
    description: "Complete 5 tasks in one day",
    icon: "⚡",
    sort_order: 7,
  },
  {
    title: "Consistent Grind",
    description: "Maintain a 14-day streak",
    icon: "💪",
    sort_order: 8,
  },
  {
    title: "High Roller",
    description: "Earn 1000 XP",
    icon: "💰",
    sort_order: 9,
  },
  {
    title: "Master Planner",
    description: "Create 50 recurring tasks",
    icon: "📋",
    sort_order: 10,
  },
  {
    title: "Time Master",
    description: "Complete a 120-minute task",
    icon: "⏰",
    sort_order: 11,
  },
  {
    title: "Epic Achiever",
    description: "Complete 5 epic difficulty tasks",
    icon: "🎯",
    sort_order: 12,
  },
  {
    title: "Unstoppable Force",
    description: "Maintain a 60-day streak",
    icon: "🚀",
    sort_order: 13,
  },
];

async function seed() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("❌ DATABASE_URL not set");
      process.exit(1);
    }

    console.log("🔄 Connecting to Neon...");
    const client = postgres(dbUrl, {
      max: 1,
      connect_timeout: 10,
    });

    const db = drizzle(client, { schema });

    console.log(`🔄 Seeding ${ACHIEVEMENTS.length} achievements...`);

    // Insert all achievements with generated UUIDs
    const achievementsWithIds = ACHIEVEMENTS.map((a) => ({
      id: randomUUID(),
      ...a,
    }));

    await db.insert(achievements).values(achievementsWithIds).onConflictDoNothing();

    console.log("✅ Achievements seeded successfully!");

    // Verify
    const result = await (db as any).select().from(achievements);
    console.log(`✅ Total achievements in database: ${result.length}`);
    result.forEach((a: any) => {
      console.log(`   - ${a.title} (${a.icon})`);
    });

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
