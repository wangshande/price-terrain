import {newHomes} from '../../../lib/market/new-homes';
import {json,error} from '../../../lib/market/http.mjs';
export async function GET(request:Request){const u=new URL(request.url);try{return json(await newHomes({city:u.searchParams.get('city'),scope:u.searchParams.get('scope')??'national',month:u.searchParams.get('month')??'latest',offset:Number(u.searchParams.get('offset')??0)||0,force:u.searchParams.get('refresh')==='1'}));}catch(e){return error(e);}}
