/**
 * Reset user profile XP and stats
 * Usage: npx tsx scripts/reset-profile.ts
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function resetProfile() {
  try {
    // Get the user ID (you can pass this as an argument if needed)
    const userId = 'ac91f23c-6c0c-4bae-a96f-68e02a52a8dd';

    console.log(`Resetting profile for user: ${userId}`);

    // Reset profile stats
    const result = await sql`
      UPDATE profiles
      SET
        total_xp = 0,
        level = 1,
        current_streak = 0,
        longest_streak = 0,
        tasks_completed_total = 0,
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, total_xp, level, tasks_completed_total, current_streak
    `;

    if (result.length === 0) {
      console.error('Profile not found');
      process.exit(1);
    }

    console.log('✓ Profile reset successfully:', result[0]);

    // Optionally, delete XP events and task instances
    console.log('\nDeleting task instances and XP events...');

    await sql`DELETE FROM task_instances WHERE user_id = ${userId}`;
    await sql`DELETE FROM xp_events WHERE user_id = ${userId}`;
    await sql`DELETE FROM daily_summaries WHERE user_id = ${userId}`;

    console.log('✓ All user data reset successfully');
  } catch (error) {
    console.error('Error resetting profile:', error);
    process.exit(1);
  }
}

resetProfile();
