'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {useEffect} from 'react'
import {start,stop,useTracking} from '../../src/store/tracking'
const Heart=dynamic(()=>import('../../src/components/HeartView').then(m=>m.HeartView),{ssr:false})
function sleepStageName(value:number|null){if(value===null)return '—';if(value&(1<<2))return 'REM';if(value&(1<<5))return 'Deep sleep';if(value&(1<<4))return 'Light sleep';if(value&1)return 'Awake';if(value&(1<<1))return 'Asleep';return 'Sleep detected'}
export default function Dashboard(){const {bpm,oxygen,trust,source,sleepMinutes,sleepStage,sleepEfficiency,sleepingBpm}=useTracking();useEffect(()=>{void start('Demo sensor');return()=>{void stop()}},[])
 const sleep=sleepMinutes===null?sleepStageName(sleepStage):Math.floor(sleepMinutes/60)+'h '+String(sleepMinutes%60).padStart(2,'0')+'m'
 return <><small>SIGNAL DASHBOARD</small><h1>Tracking workspace</h1><div className="stats">{[['Heart rate',bpm==null?'—':bpm+' BPM'],['Oxygen estimate',oxygen==null?'—':oxygen+'%'],['Sleep',sleep],['Signal quality',trust]].map(([k,v])=><article key={k}><small>{k}</small><h2>{v}</h2><p>{k==='Sleep'&&sleepEfficiency!==null?source+' · '+sleepEfficiency+'% efficiency':k==='Sleep'&&sleepingBpm!==null?source+' · '+sleepingBpm+' BPM during sleep':source}</p></article>)}</div><Heart/><section className="lab"><h2>AI insights</h2><p>Ask Aether to summarize approved records and show the dates behind each number.</p><div className="actions"><Link href="/agent">Explore records →</Link><Link href="/studio">Open Hardware Studio →</Link></div></section></>}
