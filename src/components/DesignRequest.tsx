'use client'
import {useState} from 'react'
import {Circuit} from './Circuit'
export function DesignRequest(){
 const [brief,B]=useState('Design an ESP32 fingertip sensor for heart rate and oxygen.'),[design,D]=useState<{oxygen:boolean;id:number}|null>(null),[error,F]=useState('')
 function propose(){const s=brief.toLowerCase()
 if(!/esp32|max30102|pulse|heart|oxygen|spo2/.test(s)||/ecg|eeg|servo|motor|uno|pico|5v/.test(s)){D(null);F('This board profile supports a classic ESP32 and 3.3 V MAX30102 breakout. Choose pulse or pulse plus oxygen.');return}
 F('');D({oxygen:/oxygen|spo2|saturation/.test(s),id:Date.now()})}
 return <><article><label htmlFor="brief">Design brief</label><textarea id="brief" style={{display:'block',width:'100%'}} value={brief} onChange={e=>B(e.target.value)} maxLength={400}/><div className="inputs"><button onClick={propose}>Generate design</button></div>{error&&<p role="alert">{error}</p>}</article>{design&&<Circuit key={design.id} oxygen={design.oxygen}/>}</>
}
