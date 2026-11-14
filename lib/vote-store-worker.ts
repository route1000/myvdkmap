import { env } from "cloudflare:workers";
// A single D1 batch serializes vote insertion, tally and the resulting issue status atomically.
export async function recordVote(id: string, userId: string, gone: boolean) {
  const canVote = `EXISTS(SELECT 1 FROM Issue WHERE id=? AND (status!='resolved' OR statusBeforeVotes IS NOT NULL))`;
  const weight = `(SELECT COALESCE(SUM(CASE WHEN gone=1 THEN CASE WHEN userId=Issue.authorId THEN 3 ELSE 1 END ELSE 0 END),0) FROM IssueVote WHERE issueId=Issue.id)`;
  const still = `(SELECT COUNT(*) FROM IssueVote WHERE issueId=Issue.id AND gone=0)`;
  const closed = `${weight}>=3 AND ${weight}>${still}`;
  const r = await env.DB.batch([
    env.DB.prepare(`SELECT status,statusBeforeVotes FROM Issue WHERE id=?`).bind(id),
    env.DB.prepare(`INSERT INTO IssueVote(issueId,userId,gone,createdAt) SELECT ?,?,?,? WHERE ${canVote} ON CONFLICT(issueId,userId) DO UPDATE SET gone=excluded.gone`).bind(id,userId,gone?1:0,Date.now(),id),
    env.DB.prepare(`UPDATE Issue SET statusBeforeVotes=CASE WHEN (${closed}) THEN COALESCE(statusBeforeVotes,status) ELSE NULL END, status=CASE WHEN (${closed}) THEN 'resolved' ELSE COALESCE(statusBeforeVotes,status) END WHERE id=? AND (status!='resolved' OR statusBeforeVotes IS NOT NULL)`).bind(id),
    env.DB.prepare(`SELECT ${weight} AS gone, ${still} AS still, status, statusBeforeVotes FROM Issue WHERE id=?`).bind(id),
  ]);
  const original = r[0].results[0] as { status: string; statusBeforeVotes: string | null } | undefined; if (!original) return null;
  if (original.status === "resolved" && original.statusBeforeVotes === null) return "official" as const;
  const t = r[3].results[0] as { gone: number; still: number; status: string }; return {gone:Number(t.gone),still:Number(t.still),closed:t.status==="resolved",mine:gone};
}
