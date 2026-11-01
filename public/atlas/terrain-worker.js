import {buildSurface} from './terrain-model.mjs';
self.onmessage=({data:{key,records,options}})=>{try{const mesh=buildSurface(records,options);self.postMessage({key,mesh},[mesh.vertices.buffer,mesh.lines.buffer]);}catch{self.postMessage({key,error:'地形计算失败'});}};
