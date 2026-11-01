import {communities} from '../../../lib/market/service.mjs';
import {persist} from '../../../lib/market/repository';
import {json,error} from '../../../lib/market/http.mjs';
export async function GET(request:Request){const u=new URL(request.url);try{const data=await communities(u.searchParams.get('city'),{offset:Number(u.searchParams.get('offset')??0),limit:6,force:u.searchParams.get('refresh')==='1'});return json({...data,storage:await persist(data.records,'communities:'+data.city)});}catch(e){return error(e);}}
