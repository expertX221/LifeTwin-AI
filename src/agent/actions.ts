import Ajv from 'ajv'
export const kinds=['log','experiment','check-in','memory','export','explain','delete','edit'] as const
export type Kind=typeof kinds[number]
export type Action={kind:Kind;label:string;date:string;bpm?:number;quality?:number;id?:string}
const properties={kind:{enum:kinds},label:{type:'string',minLength:1,maxLength:240},date:{type:'string',pattern:'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'},bpm:{type:'number',minimum:1,maximum:300},quality:{type:'number',minimum:0,maximum:1},id:{type:'string',minLength:1}}
export const schemas=Object.fromEntries(kinds.map(kind=>[kind,{type:'object',additionalProperties:false,properties:{...properties,kind:{const:kind}},required:['kind','label','date',...(kind==='log'?['bpm','quality']:[]),...(['delete','edit'].includes(kind)?['id']:[])]}]))
const ajv=new Ajv(),checks=Object.fromEntries(kinds.map(k=>[k,ajv.compile(schemas[k])]))
export function valid(action:Action){return Boolean(checks[action.kind]?.(action))&&new Date(action.date+'T12:00:00Z').toISOString().startsWith(action.date)}
export type Entry=Action&{id:string}
const key='lifetime.approved.v1'
export function read():Entry[]{const entries:unknown=JSON.parse(localStorage.getItem(key)??'[]');if(!Array.isArray(entries))throw Error('Invalid local records');return entries.filter(e=>e&&typeof e.id==='string'&&kinds.includes(e.kind)&&valid(e))}
export function commit(a:Action){if(!valid(a))throw Error('Invalid tool arguments')
 const entries=read()
 if(a.kind==='delete'||a.kind==='edit'){const i=entries.findIndex(e=>e.id===a.id);if(i<0)throw Error('Record no longer exists');if(a.kind==='delete')entries.splice(i,1);else entries[i]={...entries[i],label:a.label}}
 else if(a.kind!=='export'&&a.kind!=='explain')entries.push({...a,id:crypto.randomUUID()})
 localStorage.setItem(key,JSON.stringify(entries));return entries
}
