import {market} from '../../../lib/market/service.mjs';
import {persist} from '../../../lib/market/repository';
import {json,error} from '../../../lib/market/http.mjs';
export async function GET(request:Request){const u=new URL(request.url);try{const data=await market(u.searchParams.get('month'),{force:u.searchParams.get('refresh')==='1'});const storage=data.status==='live'?await persist(data.records,'national'): {saved:false,reason:'snapshot_not_saved_as_live'};return json({...data,storage});}catch(e){return error(e);}}
