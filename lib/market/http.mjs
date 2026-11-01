export function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function error(error){return json({ok:false,error:error.message??'来源暂不可用',records:[],fetchedAt:null},502);}
