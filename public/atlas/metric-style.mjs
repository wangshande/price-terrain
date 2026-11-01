export const PRICE_STOPS=[[0,'#f5eccb'],[.35,'#dec68c'],[.7,'#b98d43'],[1,'#79501f']];
export const TREND_STOPS=[[-20,'#2166ac'],[0,'#f1f3f5'],[20,'#d46416']];
export const MISSING_COLOUR='#a6adb4';
export function rgb(hex){return[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
export function ramp(value,stops){for(let i=1;i<stops.length;i++){if(value<=stops[i][0]){const[lo,a]=stops[i-1],[hi,b]=stops[i],t=Math.max(0,Math.min(1,(value-lo)/(hi-lo)));return rgb(a).map((v,j)=>v+(rgb(b)[j]-v)*t);}}return rgb(stops.at(-1)[1]);}
export function pricePalette(ceiling){return['interpolate',['linear'],['get','price'],...PRICE_STOPS.flatMap(([t,c])=>[5000+t*(ceiling-5000),c])];}
export const trendPalette=['case',['==',['get','change'],null],MISSING_COLOUR,['interpolate',['linear'],['coalesce',['get','change'],0],...TREND_STOPS.flat()]];
export function deltaText(value){return Number.isFinite(value)?`${value>0?'+':''}${Math.abs(value)<.05?'0.0':value.toFixed(1)}%`:'缺少基期';}
export function metricText(record,trend){return trend?deltaText(record.changeSinceStart):Number.isFinite(record.price)?(record.price/10000).toFixed(2)+'万/㎡':'—';}
export function metricView(trend){return trend?{id:'trend',flat:true,title:'涨跌趋势',unit:'%',description:'蓝色下降，橙色上涨；灰色缺少基期'}:{id:'price',flat:false,title:'价格高度',unit:'元/㎡',description:'越高、金色越深，价格越高'};}
