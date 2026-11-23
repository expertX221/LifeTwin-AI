'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {useEffect} from 'react'
import {start,stop,useTracking} from '../../src/store/tracking'
const Heart=dynamic(()=>import('../../src/components/HeartView').then(m=>m.HeartView),{ssr:false})
export default function Dashboard(){const {bpm,oxygen,trust,source}=useTracking();useEffect(()=>{void start('Demo sensor');return()=>{void stop()}},[]);return <><small>SIGNAL DASHBOARD</small><h1>Tracking workspace</h1><div className="stats">{[['Heart rate',bpm==null?'—':bpm+' BPM'],['Oxygen estimate',oxygen==null?'—':oxygen+'%'],['Signal quality',trust]].map(([k,v])=><article key={k}><small>{k}</small><h2>{v}</h2><p>{source}</p></article>)}</div><Heart/><section className="lab"><h2>AI insights</h2><p>Ask Aether to summarize approved records and show the dates behind each number.</p><div className="actions"><Link href="/agent">Explore records →</Link><Link href="/studio">Open Hardware Studio →</Link></div></section></>}
