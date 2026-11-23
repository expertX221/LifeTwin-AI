import React from 'react'
import {createRoot} from 'react-dom/client'
import {HeartView} from './components/HeartView'
import {start} from './store/tracking'
import './style.css'
createRoot(document.getElementById('root')!).render(<main><div className="brand"><i>◈</i> Lifetime <em>AI</em></div><HeartView/><aside>Lifetime AI is for personal exploration and education. It is not a medical device and does not diagnose conditions.</aside></main>)
void start('Demo sensor')
