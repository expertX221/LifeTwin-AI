export type Sample = { t:number; ir?:number; red?:number; bpm?:number; oxygen?:number; motion?:boolean; contact?:boolean }
const median = (v:number[]) => {const s=v.slice().sort((a,b)=>a-b); return s.length ? (s[(s.length-1)>>1]+s[s.length>>1])/2 : 0}
// Timestamps are milliseconds. Restart the analysis window after a FIFO gap.
export function peaks(samples:Sample[], channel:'ir'|'red'='ir'):number[] {
 let values:{t:number;v:number}[]=[]
 for(const s of samples){const v=s[channel]; if(v===undefined || !Number.isFinite(v)||s.contact===false||s.motion){values=[];continue}
 if(values.length && (s.t-values.at(-1)!.t>250||s.t<=values.at(-1)!.t))values=[]
 values.push({t:s.t,v})}
 if(values.length<7)return []
 const filtered=values.map((_,i)=>median(values.slice(Math.max(0,i-2),i+3).map(p=>p.v)))
 const sorted=filtered.slice().sort((a,b)=>a-b)
 const lo=sorted[Math.floor(sorted.length*.1)], hi=sorted[Math.floor(sorted.length*.9)]
 if(hi-lo<2)return []
 const result:number[]=[]; let armed=true
 for(let i=1;i<filtered.length-1;i++){
 if(filtered[i]<lo+.4*(hi-lo))armed=true
 if(armed && filtered[i]>=lo+.75*(hi-lo) && filtered[i]>=filtered[i-1] && filtered[i]>filtered[i+1] && values[i].t-(result.at(-1)??-Infinity)>310){result.push(values[i].t);armed=false}}
 return result
}
export function calculateBpm(times:number[],now=times.at(-1)??0):number|null{
 if(times.length<4||now-times.at(-1)!>2100)return null
 const intervals=times.slice(1).map((t,i)=>t-times[i]); const m=median(intervals)
 if(m<320||m>1800||intervals.filter(i=>Math.abs(i-m)<m*.22).length<intervals.length*.75)return null
 return Math.round(60000/m)
}
