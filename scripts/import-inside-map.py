"""Import the publicly served Inside Map building geometry and indices; no private/user records."""
import json,math,pathlib,urllib.request,concurrent.futures,time,collections
ROOT=pathlib.Path(__file__).resolve().parent.parent
CACHE=pathlib.Path('/tmp/myvdkmap-inside-cache');CACHE.mkdir(exist_ok=True)
BASE='https://inside-map.mrnikitus.ru/api'
def fetch(path):
 p=CACHE/(path.strip('/').replace('/','_')+'.json')
 if p.exists():return json.loads(p.read_text())
 for attempt in range(3):
  try:
   with urllib.request.urlopen(BASE+path,timeout=40) as r:d=json.load(r)
   p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')));return d
  except urllib.error.HTTPError as e:
   if e.code==404:return {'houses':[]}
   if attempt==2:raise
  except Exception:
   if attempt==2:raise
  time.sleep(attempt+1)
m=fetch('/manifest');infra=fetch('/infra');outages=fetch('/outages')
tiles=[t for t in m['tiles'] if t.get('buildings',0)>0]
keys=[x['key'] for x in infra['metrics']]
def load(t):
 key=f"/{m['zoom']}/{t['x']}/{t['y']}"
 geo=fetch('/tiles'+key);ih=fetch('/infra/tiles'+key)['houses'];oh=fetch('/outages/tiles'+key)['houses']
 byosm={}
 for h in ih:
  if h.get('osm') is not None:
   prev=byosm.get(h['osm'])
   if prev:
    h={**h,'s':[min(a,b) if a is not None and b is not None else a if a is not None else b for a,b in zip(prev['s'],h['s'])]}
   byosm[h['osm']]=h
 out={h['osm']:h for h in oh if h.get('osm') is not None}
 bs=[]
 for b in geo['buildings']:
  i=byosm.get(b['id']);o=out.get(b['id']);h=i or o
  bs.append([b['id'],b['height'],b['ring'],i['s'] if i else None,o.get('score') if o else None,h.get('addr') if h else None])
 return {'x':t['x'],'y':t['y'],'buildings':bs},ih
chunks=collections.defaultdict(list);points={};done=0
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for geo,ih in pool.map(load,tiles):
  chunks[f"{geo['x']//4}-{geo['y']//4}"].append(geo)
  for h in ih:
   if h.get('osm') is not None and h.get('addr'):points[str(h['osm'])]=h
  done+=1
  if done%50==0:print(f'{done}/{len(tiles)} tiles',flush=True)
outdir=ROOT/'public/geo/inside';outdir.mkdir(exist_ok=True)
def ll(x,y,z):return [round(x/(2**z)*360-180,7),round(math.degrees(math.atan(math.sinh(math.pi*(1-2*y/(2**z))))),7)]
index=[]
for key,ts in sorted(chunks.items()):
 x,y=map(int,key.split('-'));sw=ll(x,y+1,13);ne=ll(x+1,y,13)
 obj={'tiles':ts};(outdir/(key+'.json')).write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')))
 index.append({'key':key,'west':sw[0],'south':sw[1],'east':ne[0],'north':ne[1],'buildings':sum(len(t['buildings']) for t in ts)})
meta={'source':'https://inside-map.mrnikitus.ru/','attribution':'© участники OpenStreetMap · Индексы: Изнанка / Inside Map','generatedAt':m['generated_at'],'infra':infra,'outages':outages,'bbox':m['bbox'],'zoom':m['zoom'],'extent':m['extent'],'chunks':index,'buildings':sum(c['buildings'] for c in index),'addressed':len(points)}
(outdir/'manifest.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')))
# Extend the existing OSM passport resolver with public addresses from the same snapshot.
p=ROOT/'data/osm-address-points.json';old=json.loads(p.read_text());existing={int(v[0]):v for v in old['points']}
for osm,h in points.items():
 if int(osm) in existing:continue
 street,sep,number=h['addr'].rpartition(',')
 if sep and street.strip() and number.strip():existing[int(osm)]=[int(osm),street.strip(),number.strip(),h['lat'],h['lon'],None]
old['points']=list(existing.values());p.write_text(json.dumps(old,ensure_ascii=False,separators=(',',':')))
print(json.dumps({'tiles':len(tiles),'chunks':len(index),'buildings':meta['buildings'],'addresses':len(existing)},ensure_ascii=False),flush=True)
