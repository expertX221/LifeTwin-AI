import {create} from 'zustand'
import {Ring,Mock,Watch,SerialSource,type DataSource} from '../data/sources'
import {peaks,calculateBpm,type Sample} from '../analytics/bpm'
const empty=()=>({ring:new Ring<Sample>(1200),history:new Ring<{t:number;bpm:number}>(300),bpm:null as number|null,oxygen:null as number|null,trustScore:null as number|null,trust:'No signal',status:'No signal',dots:[] as number[],revision:0})
export const useTracking=create(()=>({...empty(),channel:'ir' as 'ir'|'red',source:'Demo sensor',error:'',busy:false}))
let active:DataSource|undefined,timer=0
export async function stop(){clearInterval(timer);const previous=active;active=undefined;useTracking.setState({status:'No signal',bpm:null,oxygen:null,trustScore:null,trust:'No signal'});await previous?.disconnect().catch(()=>{})}
export async function start(kind:string){if(useTracking.getState().busy)return;useTracking.setState({busy:true});await stop()
 const s=kind==='USB circuit'?new SerialSource():kind==='Bluetooth watch'?new Watch():new Mock()
 useTracking.setState({...empty(),source:kind,error:'',status:'Connecting'});active=s
 try{await s.connect();let last=-Infinity,lastTrend=0;const tick=()=>{const st=useTracking.getState();for(const p of s.pull(last)){st.ring.push(p);last=p.t}
 const all=st.ring.all(),p=all.at(-1),now=Date.now()
 if(s.status==='offline'||!p||now-last>3000){useTracking.setState({status:'No signal',bpm:null,oxygen:null,trust:'No signal',trustScore:null});return}
 const dots=peaks(all.filter(v=>v.t>=last-10000),st.channel)
 const bpm=p.motion||p.contact===false?null:p.bpm===undefined?calculateBpm(dots,last):p.bpm>=30&&p.bpm<=220?p.bpm:null
 const unknown=kind==='Bluetooth watch'&&p.contact===undefined
 const trust=p.motion?'Motion detected':p.contact===false?'Move your finger':!bpm?'Weak signal':unknown?'Contact unreported':'Good contact'
 if(bpm&&last-lastTrend>=1000){st.history.push({t:last,bpm});lastTrend=last}
 useTracking.setState({bpm,oxygen:bpm?p.oxygen??null:null,dots,trust,trustScore:unknown?null:bpm?1:0,status:'Streaming',revision:st.revision+1})};tick();timer=window.setInterval(tick,100)
 }catch(e){await stop();useTracking.setState({error:e instanceof Error?e.message:String(e)})}finally{useTracking.setState({busy:false})}}

