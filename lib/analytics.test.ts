import assert from "node:assert/strict";
import { aggregateAnalytics, periodStart, type AnalyticsHouse } from "./analytics";
const now = new Date("2026-11-14T00:00:00Z");
const house = (id: string, changes: Partial<AnalyticsHouse> = {}): AnalyticsHouse => ({ id, address:id, lat:43, lng:132,
  yearBuilt:null, isDemo:true, microdistrict:{districtId:"leninsky"}, issues:[], bills:[], ...changes });
const empty = aggregateAnalytics([], now);
assert.equal(empty.averageHealth, null);
assert.deepEqual(empty.bills, []);
const unknown = aggregateAnalytics([house("osm")], now);
assert.equal(unknown.unknownHouses, 1);
assert.equal(unknown.averageHealth, null, "absence of reports is not proof of a healthy house");
const data = aggregateAnalytics([house("a", {yearBuilt:2025, issues:[{category:"road",status:"new",severity:3,createdAt:now}],
  bills:[{period:"2026-10",total:100},{period:"2026-09",total:80}]}), house("b", {yearBuilt:2020,bills:[{period:"2026-10",total:300}]})], now);
assert.equal(data.openIssues, 1);
assert.equal(data.categories.find(c=>c.key==="road")?.count, 1);
assert.equal(data.statuses.reduce((s,c)=>s+c.count,0),1);
assert.equal(data.distribution.reduce((s,c)=>s+c.count,0),2);
assert.deepEqual(data.bills.map(p=>[p.period,p.average,p.houses]),[["2026-09",80,1],["2026-10",200,2]]);
assert.equal(data.health[0].score, 85);
console.log("analytics: ok");

assert.equal(periodStart("2026-11").toISOString(), "2026-10-31T14:00:00.000Z");
assert.equal(periodStart("2026-11",true).toISOString(), "2026-11-30T14:00:00.000Z");
assert.equal(periodStart("2026-12",true).toISOString(), "2026-12-31T14:00:00.000Z");
assert.equal(aggregateAnalytics([],now,[{category:"road",status:"new",severity:1,createdAt:now}]).openIssues,1);
