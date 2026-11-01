import {CITIES,knownCity} from './cities.mjs';
import {parseNewHomeHistory,verifyCityPage,currentMonth,validMonth} from './core.mjs';
import {publicAreaPage,publicCityPage} from './service.mjs';
import {BEIJING_REGION} from './beijing-region.mjs';
import {readDataCache,writeDataCache} from './repository';
// New homes have their own cache and never enter the legacy resale observations table.
async function entity(info:any,level:string,force:boolean){const key='new-homes:v2:'+level+':'+info.name+':'+info.id,old=await readDataCache(key);if(old&&!old.stale&&!force)return{...old.data,cacheSource:'server'};try{let html;if(level==='city'){const page=await publicCityPage(info.name,{force});html=page.html;info={...info,id:page.city.slug,slug:page.city.slug,sourceUrl:page.city.sourceUrl};}else html=await publicAreaPage(info.sourceUrl,{force});verifyCityPage(html,level==='city'?info.name:info.city);const history=parseNewHomeHistory(html,level);if(!history.length)throw new Error('来源未公开新房历史');const r={...info,level,marketType:'new',history,priceType:'platform_reference',sampleCount:null,fetchedAt:new Date().toISOString()};await writeDataCache(key,'new-homes',r,4*3600000);return{...r,cacheSource:'source'};}catch(error){if(old)return{...old.data,stale:true,cacheSource:'server_stale'};throw error;}}
export async function newHomes(input:{city?:string|null,scope:string,month:string,offset:number,force:boolean}){
 if(input.month!=='latest'&&!validMonth(input.month))throw new Error('月份无效');
 const city=input.city?knownCity(input.city):null;if(input.city&&!city)throw new Error('未覆盖城市');
 let list:any[],total:number,offset=Math.max(0,Math.floor(input.offset));
 if(input.scope==='district'){if(city?.name!=='北京')return{supported:false,marketType:'new',records:[],entities:[],month:input.month==='latest'?currentMonth():input.month,availableMonths:[],region:null,pricedDistricts:0,totalDistricts:0,errors:[],note:'该城市新房区县层尚未接入。'};list=BEIJING_REGION.features.map(f=>({...f.properties,lon:f.properties.center[0],lat:f.properties.center[1],city:'北京'}));total=16;offset=0;}
 else{const selected=input.scope==='city'&&city?[city]:CITIES;total=selected.length;list=selected.slice(offset,offset+8).map(c=>({...c,id:c.slug,sourceUrl:`https://m.fang.com/fangjia/${c.slug}/`}));}
 const entities:any[]=[],errors:any[]=[];let cursor=0;await Promise.all(Array.from({length:Math.min(4,list.length)},async()=>{for(;;){const info=list[cursor++];if(!info)return;try{entities.push(await entity(info,input.scope==='district'?'district':'city',input.force));}catch(error){errors.push({name:info.name,error:(error as Error).message});}}}));
 const availableMonths=[...new Set<string>(entities.flatMap(r=>r.history.map((p:any)=>p.month)))].sort(),month=input.month==='latest'?(availableMonths.at(-1)??currentMonth()):input.month;
 const records=entities.map(r=>{const p=r.history.find((p:any)=>p.month===month);return{...r,month,price:p?.price??null};});
 const data={supported:true,marketType:'new',cacheSource:entities.every(r=>r.cacheSource==='server')?'server':'source',month,records,entities,availableMonths,totalCandidates:total,offset,nextOffset:input.scope==='district'||offset+list.length>=total?null:offset+list.length,errors,sourceUrl:city?`https://m.fang.com/fangjia/${city.slug}/`:'https://m.fang.com/fangjia/fjmap.html',fetchedAt:new Date().toISOString(),priceType:'platform_reference',status:'live',region:input.scope==='district'?BEIJING_REGION:null,totalDistricts:input.scope==='district'?16:0,pricedDistricts:input.scope==='district'?records.filter(r=>r.price!==null).length:0,note:'新房平台参考均价，与二手房分层展示；非成交价，尚未接入逐楼盘数据。'};
 if(input.scope==='city')return{...data,city:entities[0]??city,history:entities[0]?.history??[],latest:entities[0]?.history.at(-1)??null};return data;
}
