import {useEffect,useRef} from 'react'
import {useTracking} from '../store/tracking'
export function Waveform(){const ref=useRef<HTMLCanvasElement>(null),bpm=useTracking(s=>s.bpm),trust=useTracking(s=>s.trust)
 useEffect(()=>{let id=0;const draw=()=>{id=requestAnimationFrame(draw);const c=ref.current;if(!c)return
 const s=useTracking.getState(),all=s.ring.all(),last=all.at(-1)?.t??0
 const end=s.status==='Streaming'?Math.max(last,Date.now()-100):last
 const a=all.filter(p=>p.t>=end-10000 && p[s.channel]!==undefined)
 const w=c.clientWidth,h=c.clientHeight,d=Math.min(devicePixelRatio,2);if(c.width!==Math.round(w*d)||c.height!==Math.round(h*d)){c.width=Math.round(w*d);c.height=Math.round(h*d)}
 const ctx=c.getContext('2d');if(!ctx)return;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);if(!a.length)return
 const vs=a.map(p=>p[s.channel]!),lo=Math.min(...vs),range=Math.max(1,Math.max(...vs)-lo),marks=new Set(s.dots)
 const x=(t:number)=>w*(1-(end-t)/10000),y=(v:number)=>h*.83-h*.64*(v-lo)/range
 ctx.strokeStyle='#68e1c3';ctx.lineWidth=2;ctx.beginPath();a.forEach((p,i)=>{if(!i||p.t-a[i-1].t>250)ctx.moveTo(x(p.t),y(vs[i]));else ctx.lineTo(x(p.t),y(vs[i]))});ctx.stroke()
 ctx.fillStyle='#fbcb90';a.forEach((p,i)=>{if(marks.has(p.t)){ctx.beginPath();ctx.arc(x(p.t),y(vs[i]),3,0,2*Math.PI);ctx.fill()}})};draw();return()=>cancelAnimationFrame(id)},[])
 return <canvas className="wave" ref={ref} aria-label={`Optical pulse waveform. Heart rate ${bpm??'unavailable'} BPM. ${trust}.`}/>}

