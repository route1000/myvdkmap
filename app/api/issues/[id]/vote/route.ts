import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseBody, serverError } from "@/lib/ai/http";
import { currentUser } from "@/lib/auth";
import { recordVote } from "@/lib/vote-store";

const VoteInput = z.object({ gone: z.boolean({ error: "Ответьте: проблема ещё есть или уже решена" }) });

/** A signed-in resident's «уже решено» / «ещё есть»; closes or reopens the issue by `tally`. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return apiError(401, "Войдите в кабинет, чтобы отметить");
    const body = await parseBody(req, VoteInput);
    if (body instanceof NextResponse) return body;
    const { id } = await params;

    const result = await recordVote(id, user.id, body.gone);

    if (!result) return apiError(404, "Жалоба не найдена");
    if (result === "official") return apiError(409, "Проблема уже решена");
    return NextResponse.json(result);
  } catch (e) {
    return serverError(e);
  }
}
