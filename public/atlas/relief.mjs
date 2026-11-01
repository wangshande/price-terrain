// Price is a visual height, never a change to geographic longitude/latitude.
export function reliefPixels({pitch=55,local=false,district=false,exaggeration=1}={}){
 // Camera pitch changes the projection, not the price scale. A soft ceiling
 // preserves visible relief and keeps every step of the height slider useful.
 const gain=Math.max(.25,Math.min(2.5,Number.isFinite(exaggeration)?exaggeration:1));
 const ceiling=district?320:local?340:300,base=district?140:local?175:160;
 return ceiling*(1-Math.exp(-base*gain/ceiling));
}
export function projectClip(matrix,x,y,z,width,height){
 const v=[x,y,z,1],out=[0,0,0,0];for(let row=0;row<4;row++)for(let col=0;col<4;col++)out[row]+=matrix[col*4+row]*v[col];
 if(out[3]<=0)return null;return{x:(out[0]/out[3]+1)*width/2,y:(1-out[1]/out[3])*height/2};
}
