import {peaks,calculateBpm} from './bpm.ts'
export function rhythm(noise=false,flat=false){return Array.from({length:1000},(_,i)=>({t:i*10,ir:flat?50000:50000+1000*Math.sin(i*2*Math.PI/80)+(noise?(i%31===0?1200:85*Math.sin(i*17)):0)}))}
export const checks=[
 ['normal rhythm',()=>calculateBpm(peaks(rhythm()))===75],
 ['noisy rhythm',()=>Math.abs((calculateBpm(peaks(rhythm(true)))??0)-75)<=2],
 ['flat signal',()=>calculateBpm(peaks(rhythm(false,true)))===null],
 ['stale peaks',()=>calculateBpm([0,800,1600,2400],5500)===null]
] as const
