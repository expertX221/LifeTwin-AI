'use client'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {Activity} from 'lucide-react'
export function Navbar(){const path=usePathname();return <div className="mast"><Link href="/" className="wordmark"><Activity aria-hidden/>Lifetime AI</Link><nav aria-label="Primary">{[['/dashboard','Dashboard'],['/studio','Hardware Studio'],['/agent','Aether']].map(([url,title])=><Link key={url} href={url} aria-current={path===url?'page':undefined}>{title}</Link>)}</nav></div>}
