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
export class Watch extends Buffered{
 id='Bluetooth watch';device?:BluetoothDevice;ch?:BluetoothRemoteGATTCharacteristic
 private lost=()=>{this.status='offline'}
 private receive=()=>{const d=this.ch?.value;if(!d||d.byteLength<2)return;const flags=d.getUint8(0);if((flags&1)&&d.byteLength<3)return
 this.queue.push({t:Date.now(),bpm:flags&1?d.getUint16(1,true):d.getUint8(1),contact:flags&4?Boolean(flags&2):undefined})}
 async connect(){if(!navigator.bluetooth)throw Error('Web Bluetooth is unavailable in this browser.')
 this.device=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:['heart_rate']})
 const server=await this.device.gatt?.connect();if(!server)throw Error('GATT connection unavailable')
 const service=await server.getPrimaryService('heart_rate');this.ch=await service.getCharacteristic('heart_rate_measurement')
 this.ch.addEventListener('characteristicvaluechanged',this.receive);this.device.addEventListener('gattserverdisconnected',this.lost);await this.ch.startNotifications();this.status='online'}
 async disconnect(){this.status='offline';this.ch?.removeEventListener('characteristicvaluechanged',this.receive);this.device?.removeEventListener('gattserverdisconnected',this.lost);this.device?.gatt?.disconnect()}
}
