import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { districtAt } from "@/lib/search";
import { aggregateAnalytics, periodStart } from "@/lib/analytics";
import { apiError, serverError } from "@/lib/ai/http";
export const dynamic = "force-dynamic";
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional();
const Input = z.object({ district: z.string().max(100).optional(), house: z.string().max(100).optional(), from: month, to: month });
export async function GET(req: Request) {
  try {
    const parsed = Input.safeParse(Object.fromEntries(new URL(req.url).searchParams));
    if (!parsed.success) return apiError(400, "Проверьте район, дом и период");
    const { district, house, from, to } = parsed.data;
    if (from && to && from > to) return apiError(400, "Начало периода позже окончания");
    if (district && !await prisma.district.findUnique({ where: { id: district }, select: { id: true } })) return apiError(404, "Район не найден");
    const createdAt = { ...(from && { gte: periodStart(from) }), ...(to && { lt: periodStart(to, true) }) };
    const houses = await prisma.building.findMany({
      where: { ...(district && { microdistrict: { districtId: district } }), ...(house && { id: house }) },
      include: { microdistrict: { select: { districtId: true } },
        issues: { where: { createdAt }, select: { category: true, status: true, severity: true, createdAt: true } },
        bills: { where: { period: { ...(from && { gte: from }), ...(to && { lte: to }) } }, select: { period: true, total: true } } },
    });
    const unlinked = house ? [] : (await prisma.issue.findMany({where:{buildingId:null,createdAt},select:{category:true,status:true,severity:true,createdAt:true,lat:true,lng:true}}))
      .map(i => ({...i,districtId:districtAt(i.lat,i.lng)})).filter(i => !district || i.districtId===district);
    if (house && !houses.length) return apiError(404, "Дом не найден в выбранном районе");
    const districts = await prisma.district.findMany({ select: { id: true, name: true } });
    const now = new Date();
    const ranking = districts.filter(d => !district || d.id === district).map(d => {
      const a = aggregateAnalytics(houses.filter(h => h.microdistrict.districtId === d.id), now, unlinked.filter(i => i.districtId === d.id));
      return { id: d.id, name: d.name, score: a.averageHealth, coverage: a.assessedHouses, houses: a.totalHouses, openIssues: a.openIssues };
    }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    return NextResponse.json({ ...aggregateAnalytics(houses, now, unlinked), ranking }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return serverError(e); }
}
