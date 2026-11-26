import {createHash} from 'node:crypto'
import {neon} from '@neondatabase/serverless'
import {NextRequest,NextResponse} from 'next/server'

export const runtime='nodejs'
export const dynamic='force-dynamic'

const TOKEN=/^[A-Za-z0-9_-]{43}$/
const IV=/^[A-Za-z0-9_-]{16}$/
const CIPHERTEXT=/^[A-Za-z0-9_-]+$/
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})

function tokenHash(request:NextRequest){
 const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'')??''
 return TOKEN.test(token)?createHash('sha256').update(token).digest('hex'):null
}
function database(){
 const url=process.env.DATABASE_URL
 if(!url)throw new Error('Health sync storage is not configured')
 return neon(url)
}
export async function POST(request:NextRequest){
 const hash=tokenHash(request)
 if(!hash)return json({error:'Invalid sync token'},401)
 if(Number(request.headers.get('content-length')??0)>24000)return json({error:'Payload too large'},413)
 let body:unknown
 try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
 if(!body||typeof body!=='object')return json({error:'Invalid encrypted payload'},400)
 const {iv,ciphertext}=body as {iv?:unknown;ciphertext?:unknown}
 if(typeof iv!=='string'||!IV.test(iv)||typeof ciphertext!=='string'||ciphertext.length>20000||!CIPHERTEXT.test(ciphertext))return json({error:'Invalid encrypted payload'},400)
 try{const sql=database();await sql`INSERT INTO lifetwin_health_sync(token_hash,iv,ciphertext,updated_at) VALUES(${hash},${iv},${ciphertext},now()) ON CONFLICT(token_hash) DO UPDATE SET iv=EXCLUDED.iv,ciphertext=EXCLUDED.ciphertext,updated_at=now()`;return json({ok:true})}
 catch{return json({error:'Health sync storage is unavailable'},503)}
}
export async function GET(request:NextRequest){
 const hash=tokenHash(request)
 if(!hash)return json({error:'Invalid sync token'},401)
 try{const sql=database();await sql`DELETE FROM lifetwin_health_sync WHERE updated_at<now()-interval '30 days'`;const rows=await sql`SELECT iv,ciphertext,updated_at FROM lifetwin_health_sync WHERE token_hash=${hash} AND updated_at>now()-interval '30 days' LIMIT 1`;return json({snapshot:rows.length?{iv:rows[0].iv,ciphertext:rows[0].ciphertext,updatedAt:rows[0].updated_at}:null})}
 catch{return json({error:'Health sync storage is unavailable'},503)}
}
export async function DELETE(request:NextRequest){
 const hash=tokenHash(request)
 if(!hash)return json({error:'Invalid sync token'},401)
 try{const sql=database();await sql`DELETE FROM lifetwin_health_sync WHERE token_hash=${hash}`;return json({ok:true})}
 catch{return json({error:'Health sync storage is unavailable'},503)}
}
