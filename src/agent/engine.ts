import en from '../locales/en.json'
import hi from '../locales/hi.json'
import te from '../locales/te.json'
import ta from '../locales/ta.json'
import ml from '../locales/ml.json'
import kn from '../locales/kn.json'
export const languages={en,hi,te,ta,ml,kn}
export type Locale=keyof typeof languages
export type Reading={id:string;date:string;bpm:number;quality:number}
export const normalize=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[\u200b-\u200d]/g,'').replace(/\s+/g,' ').trim()
export function detect(s:string):Locale{
 for(const [l,re] of Object.entries({hi:/[\u0900-\u097f]|seene|saans|bimari|behosh/,te:/[\u0c00-\u0c7f]|gunde|oopiri/,ta:/[\u0b80-\u0bff]|nenju vali|moochu/,ml:/[\u0d00-\u0d7f]|nenju vedana/,kn:/[\u0c80-\u0cff]|ede novu/}))if(re.test(s))return l as Locale
 return 'en'
}
export function route(input:string){const s=normalize(input)
 for(const key of ['safety','medical','data'] as const)if(Object.values(languages).some(l=>l[key].split('|').some(term=>s.includes(term))))return key
 return 'general'
}
const levels:Record<Locale,string[]>={en:['medium','high'],hi:['मध्यम','उच्च'],te:['మధ్యస్థ','అధిక'],ta:['நடுத்தரம்','உயர்'],ml:['ഇടത്തരം','ഉയർന്ന'],kn:['ಮಧ್ಯಮ','ಹೆಚ್ಚು']}
export function answer(input:string,l:Locale,region:string,rows:Reading[]){
 const t=languages[l],intent=route(input),done=(s:string)=>s+'\n\n'+t.notice
 if(intent==='safety')return done(t.urgent+({'India':' · 112','US':' · 911','UK':' · 999'}[region]??'')+'.')
 if(intent==='medical')return done(t.clinician)
 if(intent!=='data')return done(t.help)
 const trusted=rows.filter(r=>Number.isFinite(r.bpm)&&r.quality>=.7&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)).sort((a,b)=>a.date.localeCompare(b.date))
 if(new Set(trusted.map(r=>r.date)).size<3)return done(t.missing)
 const mean=trusted.reduce((n,r)=>n+r.bpm,0)/trusted.length
 const stable=trusted.filter(r=>Math.abs(r.bpm-mean)<=mean*.15).length/trusted.length
 const high=new Set(trusted.map(r=>r.date)).size>=14&&stable>=.8&&trusted.every(r=>r.quality>=.85)
 return done(t.mean+' '+mean.toFixed(1)+' BPM\n'+trusted[0].date+' — '+trusted[trusted.length-1].date+' · '+trusted.length+' '+t.records+' · BPM\n'+t.confidence+' · '+levels[l][Number(high)])
}
