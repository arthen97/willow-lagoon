import {createPrologue} from './prologue.js';
import * as THREE from 'three';
import {createExpedition} from './expedition.js?v=20261016-blue';

const $=selector=>document.querySelector(selector);
const MAP={x:-60,z:-24,w:120,h:104};

// The radar is sampled from the same height function used for walking.
function buildTerrainMap(heightAt){
  const canvas=document.createElement('canvas');canvas.width=480;canvas.height=416;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(canvas.width,canvas.height);
  const heights=new Float32Array(canvas.width*canvas.height);
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const i=y*canvas.width+x,h=heightAt(MAP.x+x/4,MAP.z+y/4);heights[i]=h;
    const water=h<.045,shore=!water&&h<.13;
    const contour=!water&&x>0&&y>0&&(Math.floor(h/.2)!==Math.floor(heights[i-1]/.2)||Math.floor(h/.2)!==Math.floor(heights[i-canvas.width]/.2));
    const light=THREE.MathUtils.clamp(h,0,2)*7;
    const color=water?[22,37,37]:shore?[100,108,85]:contour?[80,91,72]:[45+light,58+light,44+light];
    pixels.data.set([...color,255],i*4);
  }
  ctx.putImageData(pixels,0,0);return canvas;
}

export function createGameUI({camera,controls,renderer,walker,state,groundHeight,ambientSound,world}){
  const stage=renderer.domElement,terrain=buildTerrainMap(groundHeight);
  const pauseMenu=$('#pause-menu'),mapDialog=$('#map-dialog'),credits=$('#credits-dialog');
  const mini=$('#minimap'),full=$('#full-map'),compass=$('#compass-canvas');
  const direction=new THREE.Vector3(),offset=new THREE.Vector3(),sphere=new THREE.Spherical(),projected=new THREE.Vector3();
  const prologue=createPrologue({enter:start});
  let started=false,ready=false,wasLocked=false,sensitivity=1,soundOn=false,soundPending=false,hudTime=0,notificationTimer,hintTimer;
  state.gameStarted=false;state.paused=true;controls.enabled=false;
  const expedition=createExpedition({walker,state,world,notify,openDialog:pause,resume,ambientSound});

  function notify(message){
    clearTimeout(notificationTimer);$('#notification').textContent=message;$('#notification').hidden=false;
    notificationTimer=setTimeout(()=>$('#notification').hidden=true,3800);
  }
  function syncSound(){
    $('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound-state').textContent=soundOn?'开启':'关闭';expedition.setMuted(!soundOn);
  }
  async function toggleSound(){
    if(soundPending)return;soundPending=true;
    try{soundOn=await ambientSound.toggle();syncSound();}catch{notify('声音暂时不可用，请在设置中重新开启。');}
    finally{soundPending=false;}
  }
  function lockCamera(){
    if(matchMedia('(pointer: coarse)').matches||!stage.requestPointerLock)return;
    try{const request=stage.requestPointerLock();request?.catch(()=>{document.body.classList.remove('hint-faded');});}catch{}
  }
  function closeMenus(){
    for(const dialog of [pauseMenu,mapDialog,credits,$('#discovery-dialog'),$('#journal-dialog'),$('#earth-dialog')])if(dialog.open)dialog.close();
    document.body.classList.remove('menu-open');
  }
  function resume(lock=true){
    if(!started)return;closeMenus();state.paused=false;controls.enabled=true;walker.clearInput();
    $('#pause').setAttribute('aria-expanded','false');if(lock)lockCamera();
  }
  function pause(dialog=pauseMenu){
    if(!started)return;expedition.stopVoice();state.paused=true;walker.clearInput();controls.enabled=false;
    document.body.classList.add('menu-open');$('#pause').setAttribute('aria-expanded','true');
    if(document.pointerLockElement===stage)document.exitPointerLock();
    if(!dialog.open)dialog.showModal();
    if(dialog===mapDialog)drawMap(full,true);
  }
  function start(){
    if(!ready||started)return;started=true;state.gameStarted=true;state.paused=false;
    walker.enable(true);controls.maxDistance=8;controls.enableDamping=false;
    $('#game-hud').hidden=false;document.body.classList.add('game-started');$('#loader').setAttribute('aria-hidden','true');$('#loader').inert=true;
    window.dispatchEvent(new Event('expedition-started'));void toggleSound();lockCamera();expedition.start();updateHud();
    hintTimer=setTimeout(()=>document.body.classList.add('hint-faded'),14000);
  }
  function interact(){expedition.interact();}
  $('#close-opening-guide').onclick=()=>{$('#opening-brief').classList.remove('guide-selected');$('#opening-guide').setAttribute('aria-expanded','false');$('#opening-guide').focus();};
  $('#start-game').onclick=()=>{if(ready)prologue.requestStart();};$('#watch-story').onclick=()=>prologue.play(false);$('#opening-guide').onclick=()=>{const shown=$('#opening-guide').getAttribute('aria-expanded')!=='true';$('#opening-guide').setAttribute('aria-expanded',String(shown));$('#opening-brief').classList.toggle('guide-selected',shown);};$('#pause').onclick=()=>pause();$('#resume-game').onclick=()=>resume();
  $('#map-toggle').onclick=()=>pause(mapDialog);$('#close-map').onclick=()=>resume();$('#interact').onclick=null;
  $('#sound').onclick=toggleSound;syncSound();
  $('#settings-toggle').onclick=()=>{const open=$('#game-settings').hidden;$('#game-settings').hidden=!open;$('#settings-toggle').setAttribute('aria-expanded',String(open));$('#settings-toggle span').textContent=open?'−':'＋';};
  $('#sensitivity').oninput=e=>{sensitivity=Number(e.target.value);$('#sensitivity-value').textContent=sensitivity.toFixed(1);};
  $('#hints-toggle').onchange=e=>{document.body.classList.toggle('hints-hidden',!e.target.checked);if(e.target.checked){clearTimeout(hintTimer);document.body.classList.remove('hint-faded');}};
  $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('当前窗口不支持全屏。');}};
  $('#credits').onclick=()=>credits.showModal();$('#close-credits').onclick=()=>credits.close();
  for(const dialog of [pauseMenu,mapDialog])dialog.addEventListener('cancel',e=>{e.preventDefault();resume();});
  addEventListener('keydown',e=>{
    if(prologue.active)return;
    if(!started){const choices=[...document.querySelectorAll('.opening-choice:not(:disabled)')];if(e.code==='ArrowDown'||e.code==='ArrowUp'){e.preventDefault();const i=choices.indexOf(document.activeElement);choices[(i+(e.code==='ArrowDown'?1:-1)+choices.length)%choices.length]?.focus();}else if(e.code==='Enter'&&!e.target.closest('button')){e.preventDefault();if(ready)prologue.requestStart();}return;}
    if(credits.open)return;
    if(e.code==='Escape'){
      e.preventDefault();e.stopImmediatePropagation();if(state.paused)resume();else pause();return;
    }
    if(e.target.matches?.('input,select,textarea'))return;
    if(e.code==='KeyM'){
      e.preventDefault();e.stopImmediatePropagation();if(mapDialog.open)resume();else if(!state.paused)pause(mapDialog);return;
    }
    if(e.code==='KeyE'&&!e.repeat){e.preventDefault();interact();}
  },true);
  document.addEventListener('pointerlockchange',()=>{
    const locked=document.pointerLockElement===stage;
    document.body.classList.toggle('aim-mode',locked);controls.enabled=!locked&&!state.paused;
    if(wasLocked&&!locked&&started&&!state.paused)pause();wasLocked=locked;
  });
  document.addEventListener('pointerlockerror',()=>document.body.classList.remove('hint-faded'));
  stage.addEventListener('click',()=>{if(started&&!state.paused&&!matchMedia('(pointer: coarse)').matches)lockCamera();});
  document.addEventListener('mousemove',e=>{
    if(document.pointerLockElement!==stage||state.paused)return;
    sphere.setFromVector3(offset.copy(camera.position).sub(controls.target));
    sphere.theta-=e.movementX*.0022*sensitivity;sphere.phi=THREE.MathUtils.clamp(sphere.phi-e.movementY*.0022*sensitivity,.42,Math.PI*.485);
    camera.position.copy(controls.target).add(offset.setFromSpherical(sphere));camera.lookAt(controls.target);
  });
  stage.addEventListener('wheel',e=>{
    if(document.pointerLockElement!==stage||state.paused)return;e.preventDefault();
    offset.copy(camera.position).sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*Math.exp(e.deltaY*.001),2.8,8));
    camera.position.copy(controls.target).add(offset);camera.lookAt(controls.target);
  },{passive:false});
  addEventListener('blur',()=>{if(started&&!state.paused)pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!state.paused)pause();});

  // Touch controls are only displayed for coarse pointers, never for small desktop windows.
  const stick=$('#move-stick'),thumb=$('#stick-thumb');let stickPointer=null;
  function moveStick(e){
    const b=stick.getBoundingClientRect(),dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2,r=b.width*.32;
    const length=Math.hypot(dx,dy),scale=Math.min(1,r/Math.max(length,.001));
    thumb.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;
    for(const [key,active] of Object.entries({left:dx<-r*.25,right:dx>r*.25,up:dy<-r*.25,down:dy>r*.25}))walker.setInput(key,active);
  }
  function releaseStick(){stickPointer=null;thumb.style.transform='';for(const key of ['up','down','left','right'])walker.setInput(key,false);}
  stick.addEventListener('pointerdown',e=>{if(state.paused)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);});
  stick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer&&!state.paused)moveStick(e);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,releaseStick);

  function drawMap(canvas,expanded){
    const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,p=walker.actor.position;
    const scale=expanded?Math.min((w-65)/MAP.w,(h-65)/MAP.h):w/28;
    const cx=expanded?0:p.x,cz=expanded?28:p.z;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#14211d';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w/2-cx*scale,h/2-cz*scale);ctx.scale(scale,scale);
    ctx.drawImage(terrain,MAP.x,MAP.z,MAP.w,MAP.h);
    ctx.lineWidth=.7/scale;ctx.strokeStyle='#d2dfbb15';ctx.beginPath();
    for(let x=-60;x<=60;x+=10){ctx.moveTo(x,-24);ctx.lineTo(x,80);}for(let z=-20;z<=80;z+=10){ctx.moveTo(-60,z);ctx.lineTo(60,z);}ctx.stroke();
    for(const node of expedition.nodes){if(!expedition.progress.discovered.has(node.id)&&node.id!=='camp')continue;ctx.save();ctx.translate(node.x,node.z);ctx.rotate(Math.PI/4);ctx.fillStyle=expedition.progress.activated.has(node.id)?'#97d2b7':node.type==='plant'?'#a9c0a2':'#d9ba7d';ctx.fillRect(-4/scale,-4/scale,8/scale,8/scale);ctx.restore();if(expanded&&node.type!=='plant'){const label={trump:'01 记忆碑',ronaldo:'02 永不退役',lebron:'03 净水台',musk:'04 冥王星',relay:'旧终端',camp:'⌂ 零号营地','cave-siphon':'蓝脉洞窟','vent-a':'潮汐气孔','lung-a':'共生肺囊','lung-b':'骨林肺囊','wreck-tank':'残骸氧气罐'}[node.id]||node.name;ctx.font=`${11/scale}px sans-serif`;ctx.fillText(label,node.x+7/scale,node.z+13/scale);}}
    ctx.save();ctx.translate(p.x,p.z);ctx.rotate(-walker.actor.rotation.y);ctx.fillStyle='#e9efdb12';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,20/scale,-Math.PI*.7,-Math.PI*.3);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f1efdc';ctx.strokeStyle='#17291d';ctx.lineWidth=1.5/scale;ctx.beginPath();ctx.moveTo(0,-7/scale);ctx.lineTo(5/scale,5/scale);ctx.lineTo(0,2/scale);ctx.lineTo(-5/scale,5/scale);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    if(expanded){ctx.font=`${13/scale}px sans-serif`;ctx.fillStyle='#d9ba7d';ctx.fillStyle='#a7bdaf';ctx.font=`${16/scale}px sans-serif`;ctx.fillText('潮 汐 湖',-23,-17);ctx.fillStyle='#dce4cf';ctx.fillText('N',53,-17);}
    ctx.restore();
  }
  function drawCompass(heading){
    const ctx=compass.getContext('2d'),w=compass.width;ctx.clearRect(0,0,w,96);ctx.textAlign='center';
    const nearest=Math.floor(heading/15)*15,labels={0:'N',90:'E',180:'S',270:'W'};
    for(let i=-5;i<=5;i++){
      const angle=nearest+i*15,degrees=(angle+720)%360,x=w/2+(angle-heading)*5.4,major=degrees%90===0;
      ctx.fillStyle=major?'#edeada':'#d6dcc0b3';ctx.fillRect(x,60,1,major?13:7);ctx.font=major?'22px sans-serif':'16px sans-serif';ctx.fillText(labels[degrees]??String(degrees).padStart(3,'0'),x,45);
    }
    const goal=expedition.target();if(!goal)return;const angle=Math.atan2(goal.x-walker.actor.position.x,-(goal.z-walker.actor.position.z))*180/Math.PI;
    const delta=((angle-heading+540)%360)-180;
    if(Math.abs(delta)<64){ctx.save();ctx.translate(w/2+delta*5.4,85);ctx.rotate(Math.PI/4);ctx.fillStyle='#d9ba7d';ctx.fillRect(-3,-3,6,6);ctx.restore();}
  }
  function updateHud(){
    camera.getWorldDirection(direction);const heading=(Math.atan2(direction.x,-direction.z)*180/Math.PI+360)%360;
    const cardinal=['N','NE','E','SE','S','SW','W','NW'][Math.round(heading/45)%8];
    $('#compass-heading').textContent=`${cardinal} · ${String(Math.round(heading)%360).padStart(3,'0')}°`;
    const p=walker.actor.position;$('#map-coordinates').textContent=`${p.x>=0?'E':'W'} ${Math.abs(p.x).toFixed(1)} · ${p.z<=0?'N':'S'} ${Math.abs(p.z).toFixed(1)}`;
    drawMap(mini,false);drawCompass(heading);if(mapDialog.open)drawMap(full,true);
  }
  function update(dt){
    if(!started)return;
    expedition.update(dt);
    hudTime+=dt;if(hudTime>.12){hudTime=0;updateHud();}
    const goal=expedition.target();if(!goal){$('#waypoint').style.display='none';return;}
    $('#waypoint-name').textContent=goal.name;$('#waypoint-distance').textContent=Math.round(Math.hypot(goal.x-walker.actor.position.x,goal.z-walker.actor.position.z))+' m';
    projected.set(goal.x,groundHeight(goal.x,goal.z)+1.2,goal.z).project(camera);
    const visible=projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.92&&Math.abs(projected.y)<.82;
    $('#waypoint').style.display=visible?'flex':'none';
    if(visible)$('#waypoint').style.transform=`translate(${(projected.x*.5+.5)*innerWidth}px,${(-projected.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`;
  }
  return {update,start,pause,resume,interact,expedition,get started(){return started;},ready(){ready=true;$('#start-game').disabled=false;$('#start-label').textContent='开始远征';$('#loading-text').textContent='生命维持在线 · 可以出发';}};
}
