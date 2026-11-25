import {Suspense,Component,useEffect,useMemo,useRef,type ReactNode} from 'react'
import {Canvas,useFrame} from '@react-three/fiber'
import {OrbitControls,useGLTF} from '@react-three/drei'
import {Box3,BufferAttribute,Group,Mesh,MeshPhysicalMaterial,Vector3} from 'three'
import {useTracking} from '../store/tracking'

export type Metric='Heart'|'Lungs'|'Brain'
type Motion=(phase:number)=>number
export const animations:Record<Metric,Motion>={
 Heart:p=>p<.42?Math.pow(Math.sin(Math.PI*p/.42),1.45):0,
 Lungs:p=>.5-.5*Math.cos(2*Math.PI*p),
 Brain:()=>0
}
type Props={metricKey:Metric;modelPath:string;animate:Motion;value?:number;summary:string}

function Tissue({metricKey,modelPath,animate,value}:Props){
 const {scene}=useGLTF(modelPath)
 const phase=useRef(0)
 const group=useMemo(()=>{
  scene.updateMatrixWorld(true)
  const box=new Box3().setFromObject(scene),center=box.getCenter(new Vector3()),size=box.getSize(new Vector3())
  const scale=2.5/Math.max(size.x,size.y,size.z),result=new Group()
  scene.traverse(obj=>{
   if(!(obj instanceof Mesh)||!obj.geometry)return
   const name=(obj.name+' '+obj.parent?.name+' '+obj.material?.name).toLowerCase()
   const geom=obj.geometry.clone().applyMatrix4(obj.matrixWorld).translate(-center.x,-center.y,-center.z).scale(scale,scale,scale)
   // The optimized brain and heart GLBs omit normals; generate them so lit materials render with their intended colors.
   if(!geom.attributes.normal)geom.computeVertexNormals()
   if(metricKey==='Lungs'){
    const mesh=new Mesh(geom,obj.material.clone())
    result.add(mesh)
    return
   }

   const vein=/vein|vena|pulmonary.trunk|pulmonary.arter/.test(name)
   const artery=/arter|aort/.test(name)
   const isBrain=metricKey==='Brain'
   const color=isBrain?'#edb2ad':vein?'#542a36':artery?'#a91e1a':'#941b19'
   const material=new MeshPhysicalMaterial({
    color,
    roughness:isBrain?.48:.27,
    metalness:0,
    clearcoat:isBrain?.24:.9,
    clearcoatRoughness:isBrain?.38:.16,
    sheen:isBrain?.28:.04,
    sheenColor:isBrain?'#ffd2cc':'#d84a3e',
    sheenRoughness:.55
   })
   const surface = isBrain ? `
      float broad = fbm3(q * 6.5);
      float folds = noise3(q * 26.0);
      float pores = noise3(q * 110.0);
      float sulcus = sin(q.x * 34.0 + sin(q.y * 21.0 + q.z * 8.0) * 1.6);
      float crease = smoothstep(0.70, 0.96, abs(sulcus));
      float variation = (broad - 0.5) * 0.12 + (folds - 0.5) * 0.075 + (pores - 0.5) * 0.028;
      diffuseColor.rgb *= 0.97 + variation - crease * 0.035;
    ` : `
      float broad = fbm3(q * 8.0);
      float fibers = noise3(q * 38.0);
      float pores = noise3(q * 125.0);
      float muscle = sin(q.x * 30.0 + sin(q.y * 17.0 + q.z * 10.0) * 1.7);
      float striae = smoothstep(0.55, 0.94, abs(muscle));
      float variation = (broad - 0.5) * 0.18 + (fibers - 0.5) * 0.10 + (pores - 0.5) * 0.035;
      diffuseColor.rgb *= 0.95 + variation - striae * 0.055;
    `
   const roughnessMin = isBrain ? 0.38 : 0.18
   const roughnessMax = isBrain ? 0.68 : 0.42
   const detailScale = isBrain ? 110.0 : 125.0
   material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace(
     '#include <common>',
     '#include <common>\nvarying vec3 tissuePosition;'
    ).replace(
     '#include <begin_vertex>',
     '#include <begin_vertex>\ntissuePosition=position;'
    )
    const tissueFunctions=`
      varying vec3 tissuePosition;
      float hash31(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
      }
      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float n000 = hash31(i);
        float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
        float x00 = mix(n000, n100, f.x);
        float x10 = mix(n010, n110, f.x);
        float x01 = mix(n001, n101, f.x);
        float x11 = mix(n011, n111, f.x);
        return mix(mix(x00, x10, f.y), mix(x01, x11, f.y), f.z);
      }
      float fbm3(vec3 p) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int octave = 0; octave < 4; octave++) {
          total += noise3(p) * amplitude;
          p = p * 2.03 + 17.1;
          amplitude *= 0.5;
        }
        return total;
      }
    `
    shader.fragmentShader=shader.fragmentShader.replace(
     '#include <common>',
     '#include <common>\n'+tissueFunctions
    ).replace(
     '#include <color_fragment>',
     `#include <color_fragment>
       vec3 q = tissuePosition;
       ${surface}`
    ).replace(
     '#include <roughnessmap_fragment>',
     `#include <roughnessmap_fragment>
       float surfaceDetail = noise3(tissuePosition * ${detailScale}) - 0.5;
       roughnessFactor = clamp(
         roughnessFactor + surfaceDetail * 0.12,
         ${roughnessMin},
         ${roughnessMax}
       );`
    )
   }
   if(metricKey==='Heart'){
    const pos=geom.attributes.position
    const offsets=new Float32Array(pos.count*3)
    for(let i=0;i<pos.count;i++){
     const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i)
     const weight=Math.min(1,Math.max(0,(.8-y)/1.6)),angle=.145*weight,squeeze=1-.075*weight
     offsets[i*3]=(x*Math.cos(angle)-z*Math.sin(angle))*squeeze-x
     offsets[i*3+1]=.13*weight
     offsets[i*3+2]=(z*Math.cos(angle)+x*Math.sin(angle))*squeeze-z
    }
    geom.morphTargetsRelative=true
    geom.morphAttributes.position=[new BufferAttribute(offsets,3)]
   }
   const mesh=new Mesh(geom,material)
   result.add(mesh)
  })
  // The supplied brain STL is oriented crown-first; show its lateral profile.
  // The supplied heart STL has its long axis on Z; rotate it upright for an anterior-style view.
  if(metricKey==='Brain') result.rotation.y=Math.PI/2
  if(metricKey==='Heart') result.rotation.x=-Math.PI/2
  return result
 },[scene,metricKey])
 useEffect(()=>()=>{group.traverse(obj=>{if(obj instanceof Mesh){obj.geometry.dispose();obj.material.dispose()}})},[group])
 useFrame((_,dt)=>{
  const rate=metricKey==='Heart'?useTracking.getState().bpm:value
  if(rate!=null)phase.current=(phase.current+Math.min(dt,.1)*rate/60)%1
  const strength=rate==null?0:animate(phase.current)
  if(metricKey==='Heart')for(const child of group.children){const influences=(child as Mesh).morphTargetInfluences;if(influences)influences[0]=strength}
  if(metricKey==='Lungs')group.scale.set(1+.045*strength,1+.028*strength,1+.07*strength)
  if(metricKey==='Brain')for(const child of group.children){const m=(child as Mesh).material as MeshPhysicalMaterial;m.emissive.setHex(0x673433);m.emissiveIntensity=(value??0)/140*(.82+.18*Math.sin(phase.current*2*Math.PI))}
 })
 return <primitive object={group}/>
}

class Boundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<p>3D rendering unavailable. Readings remain available below.</p>:this.props.children}
}

export function MetricScene(props:Props){
 return <div className="scene" role="img" aria-label={props.summary}>
  <Boundary key={props.metricKey}>
   <Canvas dpr={[1,2]} camera={{position:[0,.12,4.4],fov:39}} gl={{antialias:true,alpha:true}}>
    <hemisphereLight args={['#ffe6d6','#6f414e',1.15]}/>
    <directionalLight position={[-2,3,4]} intensity={3.1}/>
    <directionalLight position={[2,1,-2]} color="#a9cbdf" intensity={3.4}/>
    <pointLight position={[1,-.4,2]} color="#ffb59e" intensity={4}/>
    <Suspense fallback={null}><Tissue {...props}/></Suspense>
    <OrbitControls enablePan={false} enableDamping minDistance={2.2} maxDistance={6} autoRotate autoRotateSpeed={.35}/>
   </Canvas>
  </Boundary>
 </div>
}
