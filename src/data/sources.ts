import type {Sample} from '../analytics/bpm'
export class Ring<T>{
 private slots:(T|undefined)[]; private head=0; private count=0
 constructor(capacity:number){this.slots=new Array(capacity)}
 push(value:T){this.slots[this.head]=value;this.head=(this.head+1)%this.slots.length;this.count=Math.min(this.count+1,this.slots.length)}
 all():T[]{return Array.from({length:this.count},(_,i)=>this.slots[(this.head-this.count+i+this.slots.length)%this.slots.length]!)}
}
export interface DataSource {id:string;status:'online'|'offline';connect():Promise<void>;disconnect():Promise<void>;pull(since:number):Sample[]}
abstract class Buffered implements DataSource{
 abstract id:string;status:'online'|'offline'='offline';queue=new Ring<Sample>(1400)
 abstract connect():Promise<void>; abstract disconnect():Promise<void>
 pull(since:number){return this.queue.all().filter(s=>s.t>since)}
}
export class Mock extends Buffered{
 id='Demo sensor';timer=0
 async connect(){this.status='online';let t=Date.now()-9000,phase=0;const tick=()=>{const now=Date.now();t=Math.max(t,now-10000);while(t<=now){phase+=.01*(75+15*Math.sin(t/19000))/60
 const cycle=phase%1;const wave=Math.exp(-((cycle-.21)**2)/.008)+.21*Math.exp(-((cycle-.52)**2)/.014)
 this.queue.push({t,ir:51000+wave*1800,red:44000+wave*930,oxygen:98});t+=10}};tick();this.timer=window.setInterval(tick,20)}
 async disconnect(){clearInterval(this.timer);this.status='offline'}
}
interface Port{open(v:{baudRate:number}):Promise<void>;readable:ReadableStream<Uint8Array>;close():Promise<void>}
export class SerialSource extends Buffered{
 id='USB circuit';port?:Port;reader?:ReadableStreamDefaultReader<Uint8Array>;task?:Promise<void>
 async connect(){const serial=(navigator as Navigator & {serial?:{requestPort():Promise<Port>}}).serial
 if(!serial)throw Error('Web Serial is unavailable. Open this page in desktop Chrome or Edge over HTTPS or localhost.')
 this.port=await serial.requestPort();await this.port.open({baudRate:115200});this.reader=this.port.readable.getReader();this.status='online';this.task=this.read()}
 private async read(){let pending='',offset:number|undefined;const decoder=new TextDecoder()
 try{while(this.status==='online'){const {value,done}=await this.reader!.read();if(done)break;pending+=decoder.decode(value,{stream:true});const lines=pending.split('\n');pending=lines.pop()!.slice(-2048)
 for(const line of lines){try{const v=JSON.parse(line);if(![v.ts,v.ir,v.red].every(Number.isFinite))continue
 offset??=Date.now()-v.ts;this.queue.push({t:v.ts+offset,ir:v.ir,red:v.red,oxygen:Number.isFinite(v.spo2)&&v.spo2>0&&v.spo2<=100?v.spo2:undefined,contact:v.contact,motion:v.motion})}catch{/* Ignore partial or malformed records. */}}}}catch{/* Device removed. */}finally{this.reader?.releaseLock();this.status='offline'}}
 async disconnect(){this.status='offline';try{await this.reader?.cancel()}catch{}await this.task;await this.port?.close()}
}
const PULSE_OXIMETER='00001822-0000-1000-8000-00805f9b34fb'
const PHYSICAL_ACTIVITY='0000183e-0000-1000-8000-00805f9b34fb'
const PLX_CONTINUOUS='00002a5f-0000-1000-8000-00805f9b34fb'
const PLX_SPOT_CHECK='00002a5e-0000-1000-8000-00805f9b34fb'
const SLEEP_INSTANT='00002b41-0000-1000-8000-00805f9b34fb'
const SLEEP_SUMMARY='00002b42-0000-1000-8000-00805f9b34fb'
function uint24(d:DataView,o:number){return d.getUint8(o)|(d.getUint8(o+1)<<8)|(d.getUint8(o+2)<<16)}
function sfloat(d:DataView,o:number){
 const raw=d.getUint16(o,true);let mantissa=raw&0x0fff,exponent=raw>>12
 if(mantissa&0x0800)mantissa-=0x1000
 if(exponent&0x08)exponent-=0x10
 return mantissa*Math.pow(10,exponent)
}
const validOxygen=(v:number)=>Number.isFinite(v)&&v>0&&v<=100
const validBpm=(v:number)=>Number.isFinite(v)&&v>=30&&v<=220
function parseSleepSummary(d:DataView):Partial<Sample>|null{
 if(d.byteLength<16||(d.getUint8(0)&3)!==3)return null
 const flags=d.getUint8(1)|(d.getUint8(2)<<8)|(d.getUint8(3)<<16)
 const sizes=[3,3,3,2,2,1,2,2,3,3,3,3,3,3,3,3,3,3,1,3]
 let offset=16;const sample:Partial<Sample>={}
 for(let bit=0;bit<sizes.length;bit++){if(!(flags&(1<<bit)))continue;const size=sizes[bit];if(offset+size>d.byteLength)return null
 if(bit===0)sample.sleepSeconds=uint24(d,offset)
 if(bit===5){const value=d.getUint8(offset);if(value<=100)sample.sleepEfficiency=value}
 if(bit===18){const value=d.getUint8(offset);if(validBpm(value))sample.sleepingBpm=value}
 offset+=size}
 return sample
}
function parseSleepInstant(d:DataView):Partial<Sample>|null{
 if(d.byteLength<15||(d.getUint8(0)&3)!==3)return null
 const flags=d.getUint16(1,true);let offset=15;let stage:number|undefined;let bpm:number|undefined
 const sizes=[3,3,3,3,1]
 for(let bit=0;bit<sizes.length;bit++){if(!(flags&(1<<bit)))continue;const size=sizes[bit];if(offset+size>d.byteLength)return null
 if(bit===3)stage=uint24(d,offset);if(bit===4){const value=d.getUint8(offset);if(validBpm(value))bpm=value}offset+=size}
 return stage===undefined&&bpm===undefined?null:{sleepStage:stage,sleepingBpm:bpm}
}
export class Watch extends Buffered{
 id='Bluetooth watch';device?:BluetoothDevice;heart?:BluetoothRemoteGATTCharacteristic
 private listeners:{characteristic:BluetoothRemoteGATTCharacteristic;listener:EventListener}[]=[]
 private receivedAt=0;capabilities:string[]=[]
 private timestamp(){this.receivedAt=Math.max(Date.now(),this.receivedAt+1);return this.receivedAt}
 private lost:EventListener=()=>{this.status='offline'}
 private receiveHeart:EventListener=event=>{
 const d=(event.target as BluetoothRemoteGATTCharacteristic|null)?.value;if(!d||d.byteLength<2)return
 const flags=d.getUint8(0);if((flags&1)&&d.byteLength<3)return
 const bpm=flags&1?d.getUint16(1,true):d.getUint8(1)
 if(!validBpm(bpm))return
 this.queue.push({t:this.timestamp(),bpm,contact:flags&4?Boolean(flags&2):undefined})
 }
 private receiveOxygen:EventListener=event=>{
 const d=(event.target as BluetoothRemoteGATTCharacteristic|null)?.value;if(!d||d.byteLength<5)return
 const flags=d.getUint8(0);const normal={oxygen:sfloat(d,1),bpm:sfloat(d,3)};let offset=5
 let fast:{oxygen:number;bpm:number}|undefined,slow:{oxygen:number;bpm:number}|undefined
 if(flags&1){if(d.byteLength<offset+4)return;fast={oxygen:sfloat(d,offset),bpm:sfloat(d,offset+2)};offset+=4}
 if(flags&2){if(d.byteLength<offset+4)return;slow={oxygen:sfloat(d,offset),bpm:sfloat(d,offset+2)}}
 const oxygen=[slow?.oxygen,normal.oxygen,fast?.oxygen].find(v=>v!==undefined&&validOxygen(v))
 const bpm=[normal.bpm,slow?.bpm,fast?.bpm].find(v=>v!==undefined&&validBpm(v))
 if(oxygen===undefined&&bpm===undefined)return
 this.queue.push({t:this.timestamp(),oxygen,bpm})
 }
 private receiveSleepSummary:EventListener=event=>{
 const d=(event.target as BluetoothRemoteGATTCharacteristic|null)?.value;if(!d)return
 const record=parseSleepSummary(d);if(record)this.queue.push({...record,t:this.timestamp()})
 }
 private receiveSleepInstant:EventListener=event=>{
 const d=(event.target as BluetoothRemoteGATTCharacteristic|null)?.value;if(!d)return
 const record=parseSleepInstant(d);if(record)this.queue.push({...record,t:this.timestamp()})
 }
 private async listen(characteristic:BluetoothRemoteGATTCharacteristic,listener:EventListener){
 characteristic.addEventListener('characteristicvaluechanged',listener)
 try{await characteristic.startNotifications();this.listeners.push({characteristic,listener})}
 catch(error){characteristic.removeEventListener('characteristicvaluechanged',listener);throw error}
 }
 async connect(){
 if(!navigator.bluetooth)throw Error('Web Bluetooth is unavailable in this browser.')
 this.device=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:['heart_rate',PULSE_OXIMETER,PHYSICAL_ACTIVITY]})
 const server=await this.device.gatt?.connect();if(!server)throw Error('GATT connection unavailable')
 const capabilities:string[]=[]
 try{const service=await server.getPrimaryService('heart_rate');this.heart=await service.getCharacteristic('heart_rate_measurement');await this.listen(this.heart,this.receiveHeart);capabilities.push('Heart rate')}catch{}
 try{const service=await server.getPrimaryService(PULSE_OXIMETER);for(const uuid of [PLX_CONTINUOUS,PLX_SPOT_CHECK])try{const characteristic=await service.getCharacteristic(uuid);await this.listen(characteristic,this.receiveOxygen);if(!capabilities.includes('SpO₂'))capabilities.push('SpO₂')}catch{}}catch{}
 try{const service=await server.getPrimaryService(PHYSICAL_ACTIVITY)
  try{const characteristic=await service.getCharacteristic(SLEEP_SUMMARY);await this.listen(characteristic,this.receiveSleepSummary);capabilities.push('Sleep summary')}catch{}
  try{const characteristic=await service.getCharacteristic(SLEEP_INSTANT);await this.listen(characteristic,this.receiveSleepInstant);capabilities.push('Sleep stages')}catch{}
 }catch{}
 this.capabilities=capabilities
 if(!capabilities.length){this.device.gatt?.disconnect();throw Error('This watch does not expose a standard heart-rate, pulse-oximeter, or sleep Bluetooth service. The Fastrack Smart World phone app may be required for this model.')}
 this.device.addEventListener('gattserverdisconnected',this.lost);this.status='online'
 }
 async disconnect(){this.status='offline';for(const item of this.listeners)item.characteristic.removeEventListener('characteristicvaluechanged',item.listener);this.listeners=[];this.device?.removeEventListener('gattserverdisconnected',this.lost);this.device?.gatt?.disconnect()}
}
