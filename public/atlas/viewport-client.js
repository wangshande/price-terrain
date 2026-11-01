import {viewportPlan,viewportCache} from './viewport-cache.mjs';
export function viewportController({context,onData,onStatus,onDistrict}){
 const cache=viewportCache();let timer,sequence=0,busy=false,pending=null,lastPlan=null;
 const request=async(force=false,more=false)=>{const ctx=context();if(!ctx||ctx.paused)return;const serial=++sequence;if(ctx.kind==='district'){onStatus('按所选月份检查区县公开历史…');try{await onDistrict?.(ctx,force,()=>serial===sequence);}catch{if(serial===sequence)onStatus('区县历史读取失败，保留已获取月份，可刷新重试。');}return;}const plan=viewportPlan(ctx.city,ctx.autoMonth?'latest':ctx.month,ctx.bounds,Math.max(12,ctx.zoom));plan.kind='community';lastPlan=plan;
  const matches=()=>serial===sequence&&context()?.city===plan.city;
  const local=await cache.get(plan);if(!matches())return;if(local){onData(local.payload,plan);onStatus(`本地缓存 · ${local.payload.records?.length??0}个当前范围记录${local.stale?'，正在检查更新':'；不是全量小区'}`);if(!local.stale&&!force&&!more)return;}
  if(busy){pending={force,more};return;}busy=true;onStatus(local?'缓存已显示，补充当前范围…':'读取当前范围的服务端缓存…');
  const query=`city=${encodeURIComponent(ctx.city)}&bbox=${plan.bbox.join(',')}&month=${plan.month}`;
  try{const response=await fetch('/api/viewport?'+query,{cache:'no-store'});if(!response.ok)throw new Error('缓存读取失败');const existing=await response.json();if(matches()&&existing.records?.length){onData(existing,plan);onStatus(`服务端缓存 · ${existing.records.length}个记录；正在补充当前画面…`);}
   const fresh=await fetch('/api/viewport?'+query+'&collect=1&refresh='+(force?'1':'0'),{cache:'no-store'});if(!fresh.ok)throw new Error('来源更新失败');const data=await fresh.json();await cache.put(plan,data);if(matches()){onData(data,plan);onStatus(data.historyUnavailable?'已检查公开页面；该月小区历史未开放，可查看区县历史。':`已缓存 ${data.records?.length??0}个本范围记录${data.errors?.length?'；部分来源读取失败':''}；${data.hasMore?'可继续补充':'来源未保证全量'}`);}
  }catch(error){if(matches())onStatus((local?'保留本地缓存。':'')+error.message+'，可点击重新获取重试。');}finally{busy=false;if(pending){const next=pending;pending=null;queue(next.force,50,next.more);}}
 };
 function queue(force=false,delay=350,more=false){clearTimeout(timer);timer=setTimeout(()=>request(force,more),delay);}
 return{queue,cancel(){sequence++;clearTimeout(timer);pending=null;},getPlan:()=>lastPlan};
}
