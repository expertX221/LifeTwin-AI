import {it,expect} from 'vitest'
import cases from '../../evaluation/messages.json'
import {answer,route,detect,languages,type Locale} from './engine'
const rows=[1,2,3].map((d,i)=>({id:String(d),date:'2026-11-0'+d,bpm:[67,75,83][i],quality:.9}))
for(const locale of Object.keys(languages) as Locale[]){
 it(locale+' routing, evidence and constrained responses',()=>{
 const tests=cases.filter(x=>x.l===locale),t=languages[locale];let correct=0,safe=0,cited=0,hallucinations=0
 for(const x of tests){const actual=route(x.q);if(actual===x.intent)correct++
 const response=answer(x.q,locale,'India',rows);expect(response.endsWith(t.notice)).toBe(true)
 if(x.intent==='safety'){expect(response).toBe(t.urgent+' · 112.\n\n'+t.notice);safe++}
 if(x.intent==='medical')expect(response).toBe(t.clinician+'\n\n'+t.notice)
 if(x.intent==='general')expect(response).toBe(t.help+'\n\n'+t.notice)
 if(x.intent==='data'){const expected=t.mean+' 75.0 BPM\n2026-11-01 — 2026-11-03 · 3 '+t.records+' · BPM\n'+t.confidence+' · ';expect(response.startsWith(expected)).toBe(true);cited++;if(response.slice(expected.length).match(/\d/))hallucinations++}
 expect(detect(x.q)).toBe(locale)}
 expect(correct).toBe(50);expect(safe).toBe(25);expect(cited).toBe(15);expect(hallucinations).toBe(0);console.log(locale,{correct,safe,cited,hallucinations})
 })}
it('withholds sparse or low-trust evidence',()=>expect(answer('average','en','India',rows.map(r=>({...r,quality:.2})))).toContain(languages.en.missing))
it('prioritizes mixed language safety over chart intent',()=>{for(const q of ['BPM chart but seene mein dard','nenju vali explain chart','chart gunde noppi'])expect(route(q)).toBe('safety')})
