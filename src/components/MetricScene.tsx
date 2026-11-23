import {Suspense,Component,useMemo,useRef,type ReactNode} from 'react'
import {Canvas,useFrame} from '@react-three/fiber'
import {OrbitControls,useGLTF} from '@react-three/drei'
import {Color,Group,Mesh,MeshStandardMaterial} from 'three'
import {useTracking} from '../store/tracking'
export type Metric='Heart'|'Lungs'|'Brain'|'Sleep'|'Energy'|'Steps'
type Motion=(group:Group,value:number,time:number)=>void
export const animations:Record<Metric,Motion>={
 Heart:(g,v,t)=>g.scale.setScalar(1+.08*Math.sin(t*v/60*2*Math.PI)),
 Lungs:(g,v,t)=>g.scale.set(1+.06*Math.sin(t*v/60*2*Math.PI),1,1+.04*Math.sin(t*v/60*2*Math.PI)),
 Brain:(g,v)=>g.traverse(o=>{if(o instanceof Mesh){const m=o.material as MeshStandardMaterial;m.emissive.set('#805cfa');m.emissiveIntensity=v/100}}),
 Sleep:(g,v)=>g.traverse(o=>{if(o instanceof Mesh)o.material.color.copy(new Color('#534caa').lerp(new Color('#94dcc9'),Math.min(1,v/10)))}),
 Energy:()=>{},Steps:(g,v,t)=>{g.position.y=.08*Math.abs(Math.sin(t*Math.min(4,v/3000)))}}
function Asset({path}:{path:string}){const {scene}=useGLTF(path);const copy=useMemo(()=>scene.clone(true),[scene]);return <primitive object={copy}/>}
type Props={metricKey:Metric;modelPath?:string;animate:Motion;value?:number;summary:string}
function Body({metricKey,modelPath,animate,value}:Props){const group=useRef<Group>(null),time=useRef(0);useFrame((_,dt)=>{const g=group.current;if(!g)return
 const v=metricKey==='Heart'?useTracking.getState().bpm:value
 if(v==null||!Number.isFinite(v)){g.scale.setScalar(1);return}time.current+=Math.min(dt,.1);g.rotation.y+=dt*.09;animate(g,v,time.current)})
 return <group ref={group}>{modelPath?<Asset path={modelPath}/>:<group rotation={[0,0,Math.PI/2]}><mesh><torusGeometry args={[.95,.12,12,72]}/><meshStandardMaterial color="#284347"/></mesh><mesh><torusGeometry args={[.95,.14,12,72,Math.PI*2*(value??0)/100]}/><meshStandardMaterial color="#73e9b4"/></mesh></group>}</group>}
class Boundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}};render(){return this.state.failed?<p>3D rendering unavailable. The readings are shown below.</p>:this.props.children}}
export function MetricScene(props:Props){return <div className="scene" role="img" aria-label={props.summary}><Boundary><Canvas dpr={[1,1.5]} camera={{position:[0,.18,4.5],fov:39}} gl={{antialias:true,alpha:true}}><ambientLight intensity={1.2}/><directionalLight position={[3,5,4]} intensity={3}/><pointLight position={[-2,0,2]} color="#ff779f" intensity={9}/><directionalLight position={[0,2,-3]} color="#83ece2" intensity={4}/><Suspense fallback={null}><Body key={props.metricKey} {...props}/></Suspense><OrbitControls enablePan={false} enableZoom={false} enableDamping/></Canvas></Boundary></div>}
