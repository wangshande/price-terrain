import {viewportQuery} from '../../../lib/market/viewport';
import {json,error} from '../../../lib/market/http.mjs';
export async function GET(request:Request){const u=new URL(request.url);try{return json(await viewportQuery({city:u.searchParams.get('city')??'',bbox:u.searchParams.get('bbox'),month:u.searchParams.get('month')??'latest',collect:u.searchParams.get('collect')==='1',force:u.searchParams.get('refresh')==='1',focus:u.searchParams.get('focus')??undefined}));}catch(e){return error(e);}}
