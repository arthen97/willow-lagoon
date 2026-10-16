import React,{useRef} from 'react';
import {createRoot} from 'react-dom/client';
import TechText from './react-bits/TechText.jsx';
import StrokeText from './react-bits/StrokeText.jsx';
import LaserFlow from './react-bits/LaserFlow.jsx';
const roots=[];
for(const el of document.querySelectorAll('[data-tech-text]')){
 const root=createRoot(el);roots.push(root);
 root.render(<TechText text={el.dataset.techText} fontFamily="'Helvetica Neue', sans-serif" fontSize={el.dataset.hero?30:18} fontWeight={500} letterSpacing={.12} color="currentColor" accentColor="#edb071" align={el.dataset.hero?"center":"left"} reach={85} strokeWidth={1} dashLength={3} dashGap={2} labels={false} specks={5} draggable={false} intro="assemble" introDuration={1.25} selection={true} sweep={true} />);
}
// Release the canvases after entering the game; the menus remain ordinary accessible buttons.
window.addEventListener('expedition-started',()=>roots.forEach(root=>root.unmount()),{once:true});

// Studio ident mounts only while the pre-CG title is visible, then releases its WebGL context.

function StudioIdent(){
 const surface=useRef(null),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 return <div className="studio-ident">
  <div className="studio-laser" aria-hidden="true"><LaserFlow surfaceRef={surface} color="#79d9d6" beamPosition={.5} intensity={1.2} beamWidth={.75} flare={.7} spread={1.2} spill={.6} fog={.12} dust={.45} streaks={.8} dots={.4} pulse={.25} speed={.7} dpr={1} mouseInteraction={false} intro={!reduce} paused={reduce}/></div>
  <div className="studio-wordmark" ref={surface}><span className="studio-kicker">AN</span><StrokeText text="ARTHEN" strokeColor="#a1e5dd" fillColor="#f0f3e8" strokeWidth={1} drawDuration={1.65} fillDelay={.35} stagger={.09} fontFamily="'Helvetica Neue', sans-serif" fontSize={128} fontWeight={500} letterSpacing={13} fillMode="wipe" trigger="mount" /><span className="studio-credit">PRODUCTION</span></div>
 </div>;
}
let studioRoot=null;
function showStudio(active){const mount=document.getElementById('studio-react');if(!mount)return;if(active){studioRoot??=createRoot(mount);studioRoot.render(<StudioIdent/>);document.getElementById('studio-fallback').hidden=true;}else if(studioRoot){studioRoot.unmount();studioRoot=null;document.getElementById('studio-fallback').hidden=false;}}
window.addEventListener('studio-ident',e=>showStudio(e.detail.active));
if(document.getElementById('prologue')?.classList.contains('studio-phase'))showStudio(true);
