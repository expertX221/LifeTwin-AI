// Built as a same-origin module with esbuild. Weights download only after opt-in.
import {CreateMLCEngine} from '@mlc-ai/web-llm'
let engine
export async function classify(prompt,message){
 if(!navigator.gpu)throw Error('WebGPU unavailable')
 if(!engine)engine=CreateMLCEngine('Qwen2.5-0.5B-Instruct-q4f16_1-MLC').catch(error=>{engine=undefined;throw error})
 const instance=await engine
 const result=await instance.chat.completions.create({messages:[{role:'system',content:prompt},{role:'user',content:message}],temperature:0,max_tokens:5})
 return result.choices[0]?.message?.content??''
}
