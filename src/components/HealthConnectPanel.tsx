'use client'
import {useCallback,useEffect,useMemo,useState} from 'react'
import {QRCodeSVG} from 'qrcode.react'

type Pairing={token:string;key:string}
type Metrics={heartRate:number|null;heartRateAt:string|null;oxygen:number|null;oxygenAt:string|null;sleepMinutes:number|null;sleepStart:string|null;sleepEnd:string|null;collectedAt:string}
const STORAGE='lifetwin-health-connect-v1'
const encode=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
const decode=(value:string)=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))
const secret=()=>encode(crypto.getRandomValues(new Uint8Array(32)))
const shownAt=(value:string|null)=>value?new Date(value).toLocaleString():'—'

export function HealthConnectPanel(){
 const [pairing,setPairing]=useState<Pairing|null>(null)
 const [showQr,setShowQr]=useState(false)
 const [metrics,setMetrics]=useState<Metrics|null>(null)
 const [status,setStatus]=useState('Not connected')
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 useEffect(()=>{try{const saved=localStorage.getItem(STORAGE);if(saved){setPairing(JSON.parse(saved));setStatus('Waiting for phone sync')}}catch{localStorage.removeItem(STORAGE)}},[])
 const refresh=useCallback(async(current:Pairing)=>{
  try{
   const response=await fetch('/api/health-sync',{headers:{Authorization:`Bearer ${current.token}`},cache:'no-store'})
   if(!response.ok)throw new Error(response.status===503?'Cloud sync needs setup':'Could not read the phone sync')
   const body=await response.json()
   if(!body.snapshot){setStatus('Waiting for phone sync');return}
   const key=await crypto.subtle.importKey('raw',decode(current.key),{name:'AES-GCM'},false,['decrypt'])
   const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(body.snapshot.iv)},key,decode(body.snapshot.ciphertext))
   setMetrics(JSON.parse(new TextDecoder().decode(clear)) as Metrics)
   setStatus(`Last phone sync ${shownAt(body.snapshot.updatedAt)}`);setError('')
  }catch(e){setError(e instanceof Error?e.message:'Phone sync is unavailable')}
 },[])
 useEffect(()=>{if(!pairing)return;void refresh(pairing);const timer=window.setInterval(()=>void refresh(pairing),5000);return()=>window.clearInterval(timer)},[pairing,refresh])
 const qrValue=useMemo(()=>pairing&&typeof window!=='undefined'?JSON.stringify({v:1,api:`${window.location.origin}/api/health-sync`,token:pairing.token,key:pairing.key}):'', [pairing,showQr])
 const connect=()=>{const next={token:secret(),key:secret()};localStorage.setItem(STORAGE,JSON.stringify(next));setPairing(next);setMetrics(null);setShowQr(true);setStatus('Scan with the Android companion');setError('')}
 const forget=async()=>{if(!pairing)return;setBusy(true);try{await fetch('/api/health-sync',{method:'DELETE',headers:{Authorization:`Bearer ${pairing.token}`}})}catch{}localStorage.removeItem(STORAGE);setPairing(null);setMetrics(null);setShowQr(false);setStatus('Not connected');setError('');setBusy(false)}
 return <section className="health-connect lab" aria-labelledby="health-connect-title">
  <div className="health-connect-heading"><div><small>PHONE HEALTH SYNC</small><h2 id="health-connect-title">Fastrack via Health Connect</h2></div><span className="health-connect-status">{status}</span></div>
  <p>Connect the Android companion to show the latest heart rate, oxygen saturation and sleep records shared with Health Connect.</p>
  {metrics?<div className="health-connect-metrics">
   <article><small>Heart rate</small><h2>{metrics.heartRate==null?'—':`${metrics.heartRate} BPM`}</h2><p>Measured {shownAt(metrics.heartRateAt)}</p></article>
   <article><small>Oxygen saturation</small><h2>{metrics.oxygen==null?'—':`${metrics.oxygen}%`}</h2><p>Measured {shownAt(metrics.oxygenAt)}</p></article>
   <article><small>Most recent sleep</small><h2>{metrics.sleepMinutes==null?'—':`${Math.floor(metrics.sleepMinutes/60)}h ${String(metrics.sleepMinutes%60).padStart(2,'0')}m`}</h2><p>{metrics.sleepStart?`${shownAt(metrics.sleepStart)} – ${shownAt(metrics.sleepEnd)}`:'No sleep session found'}</p></article>
  </div>:null}
  {pairing&&showQr?<div className="health-connect-pair"><div className="health-connect-qr"><QRCodeSVG value={qrValue} size={220} level="M" includeMargin/></div><div><strong>Scan using LifeTwin Health Sync on your Moto G45</strong><p>Keep this pairing code private. It contains the keys used to encrypt and send the readings.</p><button onClick={()=>setShowQr(false)}>Hide pairing code</button></div></div>:null}
  {error?<p role="alert">{error}</p>:null}
  <div className="health-connect-actions">{!pairing?<button onClick={connect}>Pair Android phone</button>:<>
   {!showQr?<button onClick={()=>setShowQr(true)}>Show pairing code</button>:null}
   <button className="quiet" disabled={busy} onClick={()=>void refresh(pairing)}>Refresh now</button>
   <button className="quiet" disabled={busy} onClick={()=>void forget()}>Disconnect and erase</button>
  </>}</div>
  <small className="health-connect-footnote">The phone encrypts readings before upload. The server stores only the encrypted latest snapshot.</small>
 </section>
}
