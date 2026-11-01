import {city} from '../../../lib/market/service.mjs';
import {persist} from '../../../lib/market/repository';
import {json,error} from '../../../lib/market/http.mjs';
export async function GET(request:Request){const u=new URL(request.url);try{const data=await city(u.searchParams.get('city'),{force:u.searchParams.get('refresh')==='1'});const rows=data.history.map((p:any)=>({...p,name:data.city.name,lon:data.city.lon,lat:data.city.lat,sourceUrl:data.sourceUrl,priceType:data.priceType,fetchedAt:data.fetchedAt}));return json({...data,storage:await persist(rows,'city-history:'+data.city.name)});}catch(e){return error(e);}}
