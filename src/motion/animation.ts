export type Point2D={x:number;y:number};
const finite=(v:number,n:string)=>{if(!Number.isFinite(v))throw new Error(n+' must be finite.');};
export const clamp01=(v:number)=>{finite(v,'value');return Math.max(0,Math.min(1,v));};
export const smoothstep=(v:number)=>{const t=clamp01(v);return t*t*(3-2*t);};
export const getProgress=(frame:number,start:number,end:number)=>{finite(frame,'frame');finite(start,'start');finite(end,'end');if(end<=start)throw new Error('endFrame must be greater than startFrame.');return clamp01((frame-start)/(end-start));};
export const getLoopAngle=(frame:number,period:number,phase=0)=>{finite(frame,'frame');finite(phase,'phase');if(!Number.isFinite(period)||period<=0)throw new Error('periodFrames must be greater than zero.');const turns=frame/period+phase/360;return ((turns%1)+1)%1*360;};
export const getOrbitPosition=(frame:number,period:number,rx:number,ry=rx,phase=-90):Point2D=>{finite(rx,'radiusX');finite(ry,'radiusY');if(rx<0||ry<0)throw new Error('Orbit radii cannot be negative.');const a=getLoopAngle(frame,period,phase)*Math.PI/180;return{x:Math.cos(a)*rx,y:Math.sin(a)*ry};};
export const getOscillation=(frame:number,period:number,amplitude:number,phase=0)=>{finite(frame,'frame');finite(amplitude,'amplitude');finite(phase,'phase');if(period<=0)throw new Error('periodFrames must be greater than zero.');return Math.sin(frame/period*Math.PI*2+phase)*amplitude;};
export const getParallaxOffset=(frame:number,period:number,distance:number,phase=0):Point2D=>({x:getOscillation(frame,period,distance,phase),y:getOscillation(frame,period*1.37,distance*.55,phase+Math.PI/2)});
