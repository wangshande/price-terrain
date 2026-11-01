import test from 'node:test';
import assert from 'node:assert/strict';
import {viewportPlan,viewportCache,contains,validBounds,inBounds} from '../public/atlas/viewport-cache.mjs';
import {BEIJING_REGION} from '../lib/market/beijing-region.mjs';
import {orderedDistricts} from '../lib/market/viewport-core.mjs';
test('视口预加载包含画面，城市、月份与精度隔离缓存',()=>{
 const b=[116.3,39.84,116.55,40.04],p=viewportPlan('北京','2026-11',b,13);
 assert.ok(contains(p.bbox,b));assert.ok(p.bbox[0]<b[0]&&p.bbox[2]>b[2]);
 assert.notEqual(p.key,viewportPlan('北京','2026-10',b,13).key);
 assert.notEqual(p.key,viewportPlan('上海','2026-11',b,13).key);
 assert.notEqual(p.key,viewportPlan('北京','2026-11',b,10).key);
 for(const invalid of [[116,40,115,41],[73,18,136,54],[NaN,40,117,41]])assert.throws(()=>validBounds(invalid));
 assert.equal(inBounds({lon:116.4,lat:39.9},b),true);assert.equal(inBounds({lon:117,lat:39.9},b),false);
});
test('相邻画面复用本地缓存，跨月不串用；空结果短期缓存',async()=>{
 const cache=viewportCache(),p=viewportPlan('北京','2026-11',[116.3,39.84,116.55,40.04],13);
 await cache.put(p,{records:[{id:'real'}]});
 const near=viewportPlan('北京','2026-11',[116.31,39.85,116.54,40.03],13);
 const hit=await cache.get(near);assert.equal(hit.payload.records[0].id,'real');assert.equal(hit.cacheSource,'memory');
 assert.equal(await cache.get({...near,month:'2026-10'}),null);
 const empty=viewportPlan('北京','2020-01',p.core,13);await cache.put(empty,{records:[]});
 assert.ok((await cache.get(empty)).expiresAt-Date.now()<=60000);
});
test('北京16区边界均具有实际价格来源，视口仅匹配相交区目录',()=>{
 assert.equal(BEIJING_REGION.features.length,16);
 for(const f of BEIJING_REGION.features){assert.ok(f.properties.sourceUrl.startsWith('https://m.fang.com/fangjia/bj_list_'));assert.equal(f.properties.bbox.length,4);}
 const areas=orderedDistricts(BEIJING_REGION.features,[116.38,39.89,116.43,39.96]);assert.ok(areas.length>0&&areas.length<16);assert.ok(areas.some(f=>f.properties.name==='东城区'));
});
