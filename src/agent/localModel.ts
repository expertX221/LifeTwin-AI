import {route} from './engine'
type Intent=ReturnType<typeof route>
const allowed=new Set(['safety','medical','general','data'])
const system='Classify a message in English, Hindi, Telugu, Tamil, Malayalam or Kannada. Return exactly one word: safety, medical, data or general. safety includes chest pain, trouble breathing, fainting, stroke signs, self harm or a sudden health change. medical includes requests for diagnoses or drugs. data means a personal metric or chart question. Never answer the question.'
export async function classifyOffline(input:string,browser=false):Promise<Intent>{
 const initial=route(input)
 if(initial==='safety'||initial==='medical')return initial
 if(browser){const mod=await import(/* webpackIgnore: true */ '/browser-model.mjs' as string);const label=String(await mod.classify(system,input)).trim().toLowerCase();return allowed.has(label)?label as Intent:initial}
 const reply=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'qwen2.5:0.5b',stream:false,options:{temperature:0,num_predict:5},messages:[{role:'system',content:system},{role:'user',content:input}]})})
 if(!reply.ok)throw Error('Local model unavailable')
 const label=String((await reply.json()).message?.content??'').trim().toLowerCase()
 return allowed.has(label)?label as Intent:initial
}
