import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { user } from "@/lib/db/auth-schema";

async function check() {
  const db = getDb();
  
  // Check recent users
  const users = await db.select().from(user).orderBy(user.createdAt).limit(5);
  console.log("Recent users:", users);
  
  // Check recent profiles
  const profs = await db.select().from(profiles).orderBy(profiles.createdAt).limit(5);
  console.log("Recent profiles:", profs);
}

check().catch(console.error);