import '@fontsource/noto-sans/400.css'
import '@fontsource/noto-sans-devanagari/400.css'
import '@fontsource/noto-sans-telugu/400.css'
import '@fontsource/noto-sans-tamil/400.css'
import '@fontsource/noto-sans-malayalam/400.css'
import '@fontsource/noto-sans-kannada/400.css'
import type {Metadata} from 'next'
import {Navbar} from '../src/components/Navbar'
import './globals.css'
export const metadata:Metadata={title:'Lifetime AI | Personal intelligence lab',description:'Explore wearable signals, anatomy and hardware on your own device.'}
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><Navbar/><main>{children}</main><footer className="legal">Lifetime AI is for personal exploration and education. It is not a medical device and does not diagnose conditions.</footer></body></html>}
