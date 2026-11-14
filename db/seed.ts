import type { D1Database } from "@cloudflare/workers-types";
import dataset from "./demo-seed.json";
const ready = new WeakMap<D1Database, Promise<void>>();
export function ensureSeed(db: D1Database) {
  let task = ready.get(db);
  if (!task) {
    task = seed(db).catch(e => { ready.delete(db); throw e; });
    ready.set(db, task);
  }
  return task;
}
async function seed(db: D1Database) {
  if (await db.prepare("SELECT id FROM _DataSeed WHERE id='demo-v1'").first()) return;
  // Inserts are idempotent across concurrent cold starts. Existing records are never replaced.
  for (const [table, rows] of Object.entries(dataset)) {
    for (let i=0;i<rows.length;i+=40) {
      const statements = rows.slice(i,i+40).map(row => {
        const cols=Object.keys(row); const values=Object.values(row) as (string|number|null)[];
        return db.prepare(`INSERT OR IGNORE INTO "${table}" (${cols.map(c=>`"${c}"`).join(",")}) VALUES (${cols.map(()=>"?").join(",")})`).bind(...values);
      });
      await db.batch(statements);
    }
  }
  await db.prepare("INSERT OR IGNORE INTO _DataSeed(id) VALUES ('demo-v1')").run();
}
