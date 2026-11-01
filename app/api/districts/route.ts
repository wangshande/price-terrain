import {districtOverview} from '../../../lib/market/viewport';
import {json,error} from '../../../lib/market/http.mjs';
export async function GET(request:Request){const u=new URL(request.url);try{return json(await districtOverview(u.searchParams.get('city')??'',u.searchParams.get('refresh')==='1',u.searchParams.get('month')));}catch(e){return error(e);}}
