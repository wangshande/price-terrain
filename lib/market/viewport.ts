import {BEIJING_REGION} from './beijing-region.mjs';
import {knownCity} from './cities.mjs';
import {rankedCommunityLinks,parseDistrictHistory,validMonth,currentMonth} from './core.mjs';
import {community,publicAreaPage,publicCommunityCoordinates} from './service.mjs';
import {parseDistrictPrices,orderedDistricts} from './viewport-core.mjs';
import {readDataCache,writeDataCache,viewportObservations,persist} from './repository';
import {validBounds,inBounds} from '../../public/atlas/viewport-cache.mjs';
const running=new Map<string,Promise<any>>();
export async function districtOverview(city:string,force=false,month:string|null=null){
 if(month){if(month!=='latest'&&!validMonth(month))throw new Error('月份无效');return districtTimeline(city,month,force);}
 if(city!=='北京')return{supported:false,records:[],region:null,completeDistrictCoverage:false};
 const cached=await readDataCache('districts:bj:v1');if(cached&&!cached.stale&&!force)return{...cached.data,cacheSource:'server',cachedAt:cached.updatedAt};
 try{const html=await publicAreaPage('https://m.fang.com/fangjia/bj/',{force}),data={...parseDistrictPrices(html,BEIJING_REGION),supported:true,region:BEIJING_REGION,sourceUrl:'https://m.fang.com/fangjia/bj/',fetchedAt:new Date().toISOString(),cacheSource:'source'};await writeDataCache('districts:bj:v1','districts',data,4*3600000);await persist(data.records,'districts:北京');return data;}catch(error){if(cached)return{...cached.data,cacheSource:'server_stale',refreshError:(error as Error).message};throw error;}
}
async function districtTimeline(city:string,month:string,force=false){
 if(city!=='北京')return{supported:false,records:[],region:null,completeDistrictCoverage:false};
 const key='district-timeline:bj:v2',cached=await readDataCache(key);
 const select=(data:any,cacheSource:string)=>{const period=month==='latest'?data.availableMonths.at(-1):month,records=data.entities.flatMap((r:any)=>{const p=r.history.find((p:any)=>p.month===period);return p?[{...r,...p}]:[];});return{...data,records,month:period,cacheSource,totalDistricts:16,pricedDistricts:records.length,completeDistrictCoverage:records.length===16,completeCommunityCoverage:false};};
 if(cached&&!cached.stale&&!force)return select(cached.data,'server');
 const lock=key+':'+force;let task=running.get(lock);if(!task){task=(async()=>{const entities:any[]=[],errors:any[]=[];let cursor=0;await Promise.all(Array.from({length:4},async()=>{for(;;){const f=BEIJING_REGION.features[cursor++];if(!f)return;const p=f.properties;try{const html=await publicAreaPage(p.sourceUrl,{force}),history=parseDistrictHistory(html);if(!history.length)throw new Error('区县历史序列不可用');entities.push({id:p.id,city:'北京',name:p.name,level:'district',lon:p.center[0],lat:p.center[1],priceType:'platform_reference',sourceUrl:p.sourceUrl,fetchedAt:new Date().toISOString(),sampleCount:null,periodBasis:'district_public_history',history});}catch(error){errors.push({id:p.id,error:(error as Error).message});const old=cached?.data.entities.find((r:any)=>r.id===p.id);if(old)entities.push(old);}}}));
 if(!entities.length)throw new Error('区县历史来源暂不可用');const data={supported:true,entities,availableMonths:[...new Set(entities.flatMap(r=>r.history.map((p:any)=>p.month)))].sort(),region:BEIJING_REGION,sourceUrl:'https://m.fang.com/fangjia/bj/',fetchedAt:new Date().toISOString(),errors,note:'各区公开历史序列，按真实月份展示；非小区历史。'};
 await writeDataCache(key,'district-history',data,errors.length?5*60000:4*3600000);await persist(entities.flatMap(r=>r.history.map((p:any)=>({...r,...p}))),'district-history:北京');return data;})().finally(()=>running.delete(lock));running.set(lock,task);}
 return select(await task,'source');
}
async function catalog(city:any,area:any,force=false){const key='catalog-v2:'+city.slug+':'+area.id,old=await readDataCache(key);if(old&&!old.stale&&!force)return{key,...old.data};const html=await publicAreaPage(area.sourceUrl,{force}),prior=new Map((old?.data.records??[]).map((r:any)=>[r.id,r]));const records=rankedCommunityLinks(html,city.slug).map((r:any)=>({...prior.get(r.id) as object,...r}));const data={records,sourceUrl:area.sourceUrl,area:area.name,updatedAt:new Date().toISOString()};await writeDataCache(key,'catalog',data);return{key,...data};}
const latestRecords=(rows:any[],month:string)=>{const period=month==='latest'?rows.map(r=>r.month).sort().at(-1):month;return{month:period??null,records:rows.filter(r=>r.month===period)};};
export async function viewportQuery(input:{city:string;bbox:any;month:string;collect:boolean;force:boolean;focus?:string}){
 const c=knownCity(input.city);if(!c)throw new Error('未覆盖城市');const bbox=validBounds(input.bbox),month=input.month||'latest';if(month!=='latest'&&!validMonth(month))throw new Error('月份无效');
 const cachedRows=await viewportObservations(c.name,bbox,month==='latest'?null:month),initial=latestRecords(cachedRows,month);
 if(!input.collect)return{city:c.name,bbox,...initial,cacheSource:'server',completeCommunityCoverage:false,hasMore:true,errors:[],fetchedAt:new Date().toISOString()};
 const key=[c.name,month,...bbox,input.force,input.focus].join(':');if(running.has(key))return running.get(key);
 const task=(async()=>{
  let districtFeatures:any[]=c.name==='北京'?orderedDistricts(BEIJING_REGION.features,bbox):[];if(input.focus==='expensive'&&c.name==='北京'){const overview=await districtOverview(c.name);const prices=new Map((overview.records??[]).map((r:any)=>[r.id,r.price]));districtFeatures.sort((a,b)=>Number(prices.get(b.properties.id)??0)-Number(prices.get(a.properties.id)??0));}const areas:any[]=c.name==='北京'?districtFeatures.slice(0,2).map(f=>f.properties):[{id:c.slug,name:c.name,sourceUrl:`https://m.fang.com/fangjia/${c.slug}/`}];
  const errors:any[]=[],catalogs:any[]=[],fresh:any[]=[];let checked=0,insideCount=0;
  const historical=month!=='latest'&&month<currentMonth();
  for(const area of areas){try{catalogs.push(await catalog(c,area,input.force));}catch(e){errors.push({area:area.name,error:(e as Error).message});}}
  const unique=new Map<string,any>();for(const cat of catalogs)for(const row of cat.records)if(!unique.has(row.id))unique.set(row.id,{row,cat});
  const now=Date.now(),locationRows=historical?await viewportObservations(c.name,bbox,null):cachedRows,existing=new Map(locationRows.map(r=>[r.id,r]));for(const {row}of unique.values()){const saved=existing.get(row.id);if(saved){row.lon=saved.lon;row.lat=saved.lat;row.checkedAt=saved.fetchedAt;}}
  const candidates=[...unique.values()].filter(({row})=>{const saved=existing.get(row.id);if(!input.force){if(historical&&row.historyChecks?.[month]&&now-Date.parse(row.historyChecks[month])<6*3600000)return false;if(!historical&&saved&&now-Date.parse(saved.fetchedAt)<6*3600000)return false;}if(Number.isFinite(row.lon))return inBounds(row,bbox);return !row.checkedAt||now-Date.parse(row.checkedAt)>15*60000;}).sort((a,b)=>input.focus==='expensive'?(b.row.previewPrice??0)-(a.row.previewPrice??0):Number(Number.isFinite(b.row.lon))-Number(Number.isFinite(a.row.lon))||(b.row.previewPrice??0)-(a.row.previewPrice??0)).slice(0,8);
  let cursor=0;await Promise.all(Array.from({length:Math.min(3,candidates.length)},async()=>{for(;;){const index=cursor++;if(index>=candidates.length)return;const {row}=candidates[index];try{
   if(!Number.isFinite(row.lon)){const location=await publicCommunityCoordinates(c.slug,row.id);row.checkedAt=new Date().toISOString();if(!location){row.coordinateMissing=true;continue;}Object.assign(row,location);}
   checked++;if(!inBounds(row,bbox))continue;insideCount++;
   const point=await community(c.name,row.id,{force:input.force,location:{lon:row.lon,lat:row.lat,coordinateSource:row.coordinateSource,coordinateAccuracy:row.coordinateAccuracy}});if(historical)row.historyChecks={...row.historyChecks,[month]:new Date().toISOString()};if(Number.isFinite(point.lon)&&inBounds(point,bbox))for(const p of point.history??[{month:point.month,price:point.price}])fresh.push({...point,...p});
  }catch(e){row.checkedAt=new Date().toISOString();errors.push({id:row.id,error:(e as Error).message});}}}));
  for(const cat of catalogs){const {key,...data}=cat;await writeDataCache(key,'catalog',data);}
  const storage=fresh.length?await persist(fresh,'viewport:'+c.name):{saved:true,count:0};const all=new Map(cachedRows.map(r=>[r.id+':'+r.month+':'+r.priceType,r]));for(const r of fresh)all.set(r.id+':'+r.month+':'+r.priceType,r);const result=latestRecords([...all.values()],month);
  return{city:c.name,bbox,...result,historyChecked:historical,historyUnavailable:historical&&!result.records.length,cacheSource:fresh.length?'source_and_server':'server',storage,checked,insideCount,areas:areas.map(a=>a.name),candidateCount:unique.size,hasMore:[...unique.values()].some(({row})=>!Number.isFinite(row.lon)&&(!row.checkedAt||now-Date.parse(row.checkedAt)>15*60000)),completeCommunityCoverage:false,errors,fetchedAt:new Date().toISOString(),note:historical&&!result.records.length?'已检查小区公开页面，未返回所选历史月；可查看区县历史参考层。':'按视口相交区的公开目录补充，来源未提供完整空间索引，不代表当前范围全量小区。'};
 })().finally(()=>running.delete(key));running.set(key,task);return task;
}
