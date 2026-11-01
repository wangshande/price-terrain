// Spatial interpolation is a visual aid; it never supplies observed prices or history.
import {PRICE_STOPS,TREND_STOPS,MISSING_COLOUR,rgb,ramp} from './metric-style.mjs';
const EARTH=40075016.686;
export function mercator(lon,lat){return{x:(lon+180)/360,y:(1-Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))/Math.PI)/2};}
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
export function hull(points){const p=[...points].sort((a,b)=>a.x-b.x||a.y-b.y),lower=[],upper=[];for(const q of p){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),q)<=0)lower.pop();lower.push(q);}for(const q of [...p].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),q)<=0)upper.pop();upper.push(q);}return lower.slice(0,-1).concat(upper.slice(0,-1));}
export function inside(x,y,ring){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
export function colour(price){return ramp((price-5000)/115000,PRICE_STOPS);}
export function changeColour(delta){return Number.isFinite(delta)?ramp(delta,TREND_STOPS):rgb(MISSING_COLOUR);}
export function interpolate(x,y,points){const nearest=points.map(p=>({p,d:(x-p.x)**2+(y-p.y)**2})).sort((a,b)=>a.d-b.d).slice(0,6);if(!nearest.length)return null;if(nearest[0].d<1e-24)return nearest[0].p.price;let total=0,value=0;for(const {p,d}of nearest){const w=1/(d*d+1e-30);value+=p.price*w;total+=w;}return value/total;}
export function buildSurface(records,{resolution=88,maxDistanceMeters=600000,water=[],ceiling=120000,footprint=[],mode='price'}={}){
 const unique=new Map();for(const r of records){if(Number.isFinite(r.lon)&&Number.isFinite(r.lat)&&r.lat>-85&&r.lat<85&&Number.isFinite(r.price)&&r.price>0)unique.set(r.lon+':'+r.lat,{...r,...mercator(r.lon,r.lat)});}
 const points=[...unique.values()],trendPoints=points.filter(p=>Number.isFinite(p.changeSinceStart)).map(p=>({...p,price:p.changeSinceStart})),empty={vertices:new Float32Array(),lines:new Float32Array(),origin:[0,0],samples:points.length,triangles:0};if(points.length<3)return empty;
 const boundary=hull(points);if(boundary.length<3)return empty;
 const domain=footprint.length?footprint.flatMap(p=>p.rings[0]):points;const xs=domain.map(p=>p.x),ys=domain.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),width=maxX-minX,height=maxY-minY;if(width*height<1e-18)return empty;
 const origin=[(minX+maxX)/2,(minY+maxY)/2],unit=1/(EARTH*Math.cos(points.reduce((n,p)=>n+p.lat,0)/points.length*Math.PI/180)),reach=maxDistanceMeters*unit;
 const nx=Math.max(12,Math.round(resolution*width/Math.max(width,height))),ny=Math.max(12,Math.round(resolution*height/Math.max(width,height))),dx=width/nx,dy=height/ny,grid=[];
 const wet=(x,y)=>water.some(poly=>x>=poly.box[0]&&x<=poly.box[2]&&y>=poly.box[1]&&y<=poly.box[3]&&inside(x,y,poly.rings[0])&&!poly.rings.slice(1).some(r=>inside(x,y,r)));
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const x=minX+i*dx,y=minY+j*dy,dist=points.map(p=>(p.x-x)**2+(p.y-y)**2).sort((a,b)=>a-b),price=interpolate(x,y,points);grid.push({x,y,price,delta:mode==='change'?interpolate(x,y,trendPoints):null,ok:(footprint.length?footprint.some(p=>x>=p.box[0]&&x<=p.box[2]&&y>=p.box[1]&&y<=p.box[3]&&inside(x,y,p.rings[0])&&!p.rings.slice(1).some(r=>inside(x,y,r))):inside(x,y,boundary)&&dist[0]<reach*reach*.3&&dist[2]<reach*reach)&&!wet(x,y)});}
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const v=grid[j*(nx+1)+i],a=grid[j*(nx+1)+Math.max(0,i-1)],b=grid[j*(nx+1)+Math.min(nx,i+1)],c=grid[Math.max(0,j-1)*(nx+1)+i],d=grid[Math.min(ny,j+1)*(nx+1)+i];v.gx=(b.price-a.price)/(b.x-a.x||1);v.gy=(d.price-c.price)/(d.y-c.y||1);}
 const vertices=[],lines=[],edges=new Map();let triangles=0;
 function vertex(out,p,z=p.price,alpha=.74,dark=1){const c=mode==='change'?changeColour(p.delta):colour(z===0?5000:5000+(p.price-5000)*115000/(ceiling-5000));out.push(p.x-origin[0],p.y-origin[1],z,p.gx||0,p.gy||0,c[0]*dark,c[1]*dark,c[2]*dark,alpha);}
 function triangle(ids){if(!ids.every(i=>grid[i].ok))return;triangles++;for(const i of ids)vertex(vertices,grid[i]);for(let k=0;k<3;k++){const a=ids[k],b=ids[(k+1)%3],key=a<b?a+':'+b:b+':'+a;if(edges.has(key))edges.delete(key);else edges.set(key,[a,b]);}
  if(mode==='change')return;const low=Math.min(...ids.map(i=>grid[i].price)),high=Math.max(...ids.map(i=>grid[i].price));for(let level=Math.ceil(low/10000)*10000;level<high;level+=10000){const cuts=[];for(let k=0;k<3;k++){const a=grid[ids[k]],b=grid[ids[(k+1)%3]];if((a.price<level&&b.price>=level)||(b.price<level&&a.price>=level)){const t=(level-a.price)/(b.price-a.price);cuts.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,price:level});}}if(cuts.length===2)for(const p of cuts){lines.push(p.x-origin[0],p.y-origin[1],level+12,0,0,.36,.28,.15,.35);}}
 }
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;triangle([a,c,b]);triangle([b,c,d]);}
 // The perimeter closes the gradient into a translucent volume, rather than columns.
 for(const [ia,ib]of edges.values()){const a=grid[ia],b=grid[ib];for(const [p,z]of [[a,a.price],[a,0],[b,b.price],[b,b.price],[a,0],[b,0]])vertex(vertices,p,z,.55,.85);}
 return{vertices:new Float32Array(vertices),lines:new Float32Array(lines),origin,samples:points.length,triangles};
}
