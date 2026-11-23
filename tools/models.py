"""Build original vertex-colored, single-primitive GLBs with the Python standard library."""
from math import sin, cos, pi, exp, sqrt
import struct, json, pathlib
out=pathlib.Path(__file__).resolve().parents[1]/'public/models'
out.mkdir(parents=True,exist_ok=True)
pos=[]; colors=[]; indices=[]
def grid(fn,color,n=28,m=19):
    base=len(pos)
    for j in range(m+1):
        for i in range(n):
            p=fn(2*pi*i/n,j/m);pos.append(p);colors.append(color)
    for j in range(m):
        for i in range(n):
            a=base+j*n+i;b=base+j*n+(i+1)%n
            indices.extend((a,b,a+n,b,b+n,a+n))
def blob(center,size,color,warp=lambda x,y,z:(x,y,z)):
    def point(a,t):
        x,y,z=warp(sin(pi*t)*cos(a),cos(pi*t),sin(pi*t)*sin(a))
        return tuple(center[i]+size[i]*v for i,v in enumerate((x,y,z)))
    grid(point,color)
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def norm(a):
    d=sqrt(sum(v*v for v in a)) or 1
    return tuple(v/d for v in a)
def tube(points,r,color):
    def point(a,t):
        u=t*(len(points)-1);i=min(int(u),len(points)-2);s=u-i
        p,q=points[i:i+2];direction=norm(tuple(q[k]-p[k] for k in range(3)))
        side=norm(cross(direction,(0,0,1) if abs(direction[2])<.9 else (1,0,0)));up=cross(direction,side)
        return tuple(p[k]*(1-s)+q[k]*s+r*(cos(a)*side[k]+sin(a)*up[k]) for k in range(3))
    grid(point,color,12,len(points)-1)
def save(name):
    normals=[[0.,0.,0.] for p in pos]
    for i in range(0,len(indices),3):
        a,b,c=indices[i:i+3];n=cross(tuple(pos[b][k]-pos[a][k] for k in range(3)),tuple(pos[c][k]-pos[a][k] for k in range(3)))
        for j in (a,b,c):
            for k in range(3):normals[j][k]+=n[k]
    chunks=[];views=[];access=[]
    for vals,fmt,typ,comp,target in [(pos,'3f','VEC3',5126,34962),(list(map(norm,normals)),'3f','VEC3',5126,34962),(colors,'3f','VEC3',5126,34962),([(i,) for i in indices],'H','SCALAR',5123,34963)]:
        raw=b''.join(struct.pack('<'+fmt,*v) for v in vals);views.append(dict(buffer=0,byteOffset=sum(map(len,chunks)),byteLength=len(raw),target=target));chunks.append(raw+b'\0'*(-len(raw)%4));access.append(dict(bufferView=len(views)-1,componentType=comp,count=len(vals),type=typ))
    access[0].update(min=list(map(min,zip(*pos))),max=list(map(max,zip(*pos))))
    binary=b''.join(chunks);doc=dict(asset=dict(version='2.0'),scene=0,scenes=[dict(nodes=[0])],nodes=[dict(mesh=0)],meshes=[dict(primitives=[dict(attributes=dict(POSITION=0,NORMAL=1,COLOR_0=2),indices=3,material=0)])],materials=[dict(doubleSided=True,pbrMetallicRoughness=dict(metallicFactor=.1,roughnessFactor=.4))],buffers=[dict(byteLength=len(binary))],bufferViews=views,accessors=access)
    raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*(-len(raw)%4)
    (out/(name+'.glb')).write_bytes(struct.pack('<4sII',b'glTF',2,28+len(raw)+len(binary))+struct.pack('<I4s',len(raw),b'JSON')+raw+struct.pack('<I4s',len(binary),b'BIN\0')+binary)
    print(name,len(indices)//3,'triangles');pos.clear();colors.clear();indices.clear()
red=(.49,.06,.095);artery=(.82,.16,.13);blue=(.09,.23,.39)
blob((0,-.21,0),(.79,1,.54),red,lambda x,y,z:(x*(.8+.28*y)-.28*y,y,z*(.9+.22*y)))
for x in (-.43,.41):blob((x,.47,-.06),(.35,.34,.4),(.40,.05,.10))
tube([(-.22,.43,.02),(-.23,.9,.04),(-.11,1.13,.02),(.12,1.18,-.04),(.31,1.02,-.11),(.34,.58,-.25)],.145,artery)
for x in (-.13,.015,.14):tube([(x,1.1,0),(x-.035,1.39,-.04)],.052,artery)
tube([(-.40,.37,.3),(-.12,.65,.38),(.25,.78,.29),(.52,.77,.12)],.13,blue)
tube([(-.51,.4,-.13),(-.54,1.01,-.13)],.12,blue)
for points in [[(-.47,.49,.34),(-.18,.29,.50),(.03,.0,.49),(.14,-.42,.39),(.23,-.83,.24)], [(-.15,.28,.49),(.24,.25,.47),(.51,.08,.28)],[(.05,-.05,.49),(-.24,-.25,.40),(-.35,-.43,.29)],[(.13,-.39,.4),(.36,-.47,.31)]]:tube(points,.026,artery)
# Branching coronary vessels follow the tapered ventricular surface.
for sign in (-1,1):
    for row in range(5):
        start=.72+.29*row
        points=[]
        for step in range(9):
            t=start+step*.049
            a=1.42+sign*(step*.115+.09*row)
            y=cos(t);x=sin(t)*cos(a);z=sin(t)*sin(a)
            points.append((.79*(x*(.8+.28*y)-.28*y),-.21+y,.54*z*(.9+.22*y)+.009))
        tube(points,.012 if row%2 else .018,blue if row%3==0 else artery)
save('heart')
for sign in (-1,1):
    blob((sign*.48,-.12,0),(.43,.97,.39),(.6,.21,.27),lambda x,y,z:(x*(1-.28*y),y,z))
    tube([(0,.54,.13),(sign*.21,.25,.19),(sign*.41,-.04,.26)],.09,(.67,.50,.41))
for sign in (-1,1):
    for row in range(3):
        tube([(sign*.2,.28,.18),(sign*.34,.12,.27),(sign*(.47+.12*row),-.04-.18*row,.32)],.032,(.69,.43,.36))
    for j in range(6):
        t=j/5
        tube([(sign*(.53-.2*t),.25-.45*t,.34),(sign*(.64-.22*t),.12-.48*t,.35)],.014,(.36,.13,.14))
tube([(0,.5,.13),(0,1.14,.13)],.12,(.67,.50,.41));save('lungs')
for sign in (-1,1):
    blob((sign*.43,0,0),(.48,.75,.79),(.53,.28,.48),lambda x,y,z:tuple(v*(1+.055*cos(18*y+7*z)*cos(8*x)) for v in (x,y,z)))
for sign in (-1,1):
    for row in range(10):
        t=.36+row*.25
        path=[]
        for j in range(24):
            a=.08+j*.13
            u=t+.095*sin(a*4+row*.8)+.034*sin(9*a)
            path.append((sign*(.43+.48*sin(u)*sin(a)),.75*cos(u),.79*sin(u)*cos(a)))
        tube(path,.045,(.58,.32,.42))
save('brain')
blob((0,0,0),(.88,.88,.88),(.36,.52,.85));save('orb')
blob((0,-.08,0),(.46,.24,.88),(.34,.64,.55));blob((0,.2,-.48),(.28,.42,.27),(.34,.64,.55))
for i in range(5):blob((-.3+i*.15,-.06,.66+.12*cos(i*.7)),(.11-i*.009,.13,.22-i*.018),(.36,.66,.58))
save('foot')

