import React from 'react';
import {createRoot} from 'react-dom/client';
import TechText from './react-bits/TechText.jsx';
const roots=[];
for(const el of document.querySelectorAll('[data-tech-text]')){
 const root=createRoot(el);roots.push(root);
 root.render(<TechText text={el.dataset.techText} fontFamily="'Helvetica Neue', sans-serif" fontSize={el.dataset.hero?30:18} fontWeight={500} letterSpacing={.12} color="currentColor" accentColor="#edb071" align="left" reach={85} strokeWidth={1} dashLength={3} dashGap={2} labels={false} specks={5} draggable={false} intro="assemble" introDuration={1.25} selection={true} sweep={true} />);
}
// Release the canvases after entering the game; the menus remain ordinary accessible buttons.
window.addEventListener('expedition-started',()=>roots.forEach(root=>root.unmount()),{once:true});
