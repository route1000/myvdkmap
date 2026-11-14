import { prisma } from "./db";
import { tally } from "./votes";
export async function recordVote(id: string, userId: string, gone: boolean) {
  return prisma.$transaction(async tx => {
    const issue = await tx.issue.findUnique({where:{id},select:{status:true,statusBeforeVotes:true,authorId:true}});
    if (!issue) return null;
    if (issue.status === "resolved" && issue.statusBeforeVotes === null) return "official" as const;
    await tx.issueVote.upsert({where:{issueId_userId:{issueId:id,userId}},create:{issueId:id,userId,gone},update:{gone}});
    const votes = await tx.issueVote.findMany({where:{issueId:id},select:{gone:true,userId:true}});
    const t = tally(votes.map(v=>({gone:v.gone,author:v.userId===issue.authorId})));
    if (t.closed && issue.status !== "resolved") await tx.issue.update({where:{id},data:{status:"resolved",statusBeforeVotes:issue.status}});
    else if (!t.closed && issue.statusBeforeVotes !== null) await tx.issue.update({where:{id},data:{status:issue.statusBeforeVotes,statusBeforeVotes:null}});
    return {...t,mine:gone};
  });
}
