import * as THREE from 'three';
import {createAnimatedCharacter} from './animated-character.js?v=20261017-sunlit';
import {oxygenDrain} from './survival.js';

export function canStand(x,z,heightAt,obstacles,clearance=0) {
  if(x<-58||x>58||z<-22||z>78)return false;
  const center=heightAt(x,z);for(const [dx,dz] of [[0,0],[.18,0],[-.18,0],[0,.18],[0,-.18]]){const h=heightAt(x+dx,z+dz);if(h<.055||Math.abs(h-center)>.17)return false;}
  return !obstacles.some(o=>clearance<(o.h??2.2)+.08&&Math.hypot(x-o.x,z-o.z)<o.r+.25);
}

export function findPath(start,end,heightAt,obstacles) {
  const step=.4,grid=p=>({x:Math.round(p.x/step),z:Math.round(p.z/step)}),a=grid(start),b=grid(end),id=p=>p.x+','+p.z;
  if(!canStand(end.x,end.z,heightAt,obstacles))return [];
  const open=[{...a,g:0,f:0}],cost=new Map([[id(a),0]]),previous=new Map(),closed=new Set();
  let found;
  while(open.length&&closed.size<20000){
    open.sort((x,y)=>y.f-x.f);const current=open.pop(),key=id(current);
    if(closed.has(key))continue;closed.add(key);
    if(current.x===b.x&&current.z===b.z){found=current;break;}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const next={x:current.x+dx,z:current.z+dz},nid=id(next),x=next.x*step,z=next.z*step;
      if(closed.has(nid)||!canStand(x,z,heightAt,obstacles))continue;
      if(dx&&dz&&(!canStand(current.x*step,z,heightAt,obstacles)||!canStand(x,current.z*step,heightAt,obstacles)))continue;
      const g=current.g+Math.hypot(dx,dz);
      if(g>=(cost.get(nid)??Infinity))continue;
      cost.set(nid,g);previous.set(nid,current);open.push({...next,g,f:g+Math.hypot(next.x-b.x,next.z-b.z)});
    }
  }
  if(!found)return [];
  const path=[{x:end.x,z:end.z}];let p=found;
  while(id(p)!==id(a)){path.push({x:p.x*step,z:p.z*step});p=previous.get(id(p));}
  return path.reverse();
}

export function legAngles(z,down,upper=.45,lower=.42){
  const d=Math.min(upper+lower-.001,Math.max(.03,Math.hypot(z,down)));
  const knee=-Math.acos(THREE.MathUtils.clamp((d*d-upper*upper-lower*lower)/(2*upper*lower),-1,1));
  const hip=Math.atan2(-z,down)-Math.atan2(lower*Math.sin(knee),upper+lower*Math.cos(knee));
  return {hip,knee,ankle:-hip-knee};
}

function segmentDistance(x,y,z,a,b){
  const vx=b[0]-a[0],vy=b[1]-a[1],vz=b[2]-a[2],lengthSq=vx*vx+vy*vy+vz*vz;
  const t=THREE.MathUtils.clamp(((x-a[0])*vx+(y-a[1])*vy+(z-a[2])*vz)/lengthSq,0,1);
  return Math.hypot(x-a[0]-vx*t,y-a[1]-vy*t,z-a[2]-vz*t);
}

export function createWalker({scene,model,camera,controls,renderer,ground,groundHeight,obstacles,state,characterAsset}) {
  const actor=new THREE.Group();actor.name='WALKABLE_ASTRONAUT';actor.rotation.y=Math.PI;actor.position.set(-2.35,groundHeight(-2.35,2.8)+.012,2.8);
  model.getObjectByName('ASTRONAUT').removeFromParent();scene.add(actor);
  const animation=createAnimatedCharacter(characterAsset,actor),body=animation.body;
  const contact=new THREE.Mesh(new THREE.CircleGeometry(.32,32),new THREE.MeshBasicMaterial({color:0x101814,transparent:true,opacity:.16,depthWrite:false}));
  contact.rotation.x=-Math.PI/2;contact.position.y=.005;actor.add(contact);
  const marker=new THREE.Mesh(new THREE.RingGeometry(.13,.17,40),new THREE.MeshBasicMaterial({color:0xd6b77c,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide}));
  marker.rotation.x=-Math.PI/2;marker.visible=false;scene.add(marker);
  obstacles=[...obstacles,{x:4.05,z:.1,r:1.45}];
  const keys=new Set(),status=document.querySelector('#walk-status');
  const oxygenValue=document.querySelector('#oxygen-value'),oxygenFill=document.querySelector('#oxygen-fill'),oxygenTrack=document.querySelector('.oxygen-track'),oxygenNote=document.querySelector('#oxygen-note');
  let enabled=false,phase=0,blend=0,travel=0,path=[],heading=Math.PI,statusTime=0,reason='待命';
  let jumpHeight=0,jumpVelocity=0,jumpQueued=false,oxygen=60,jumpStage='ground',jumpClock=0;
  const runButton=document.querySelector('#run-touch'),jumpButton=document.querySelector('#jump-touch');
  const worldUp=new THREE.Vector3(0,1,0),cameraOffset=new THREE.Vector3(.55,2.3,4.8),lookOffset=new THREE.Vector3(0,.96,0),cameraPosition=new THREE.Vector3(),lookPosition=new THREE.Vector3(),motion=new THREE.Vector3();
  let motionSpeed=0,savedView=null,stamina=100,sprinting=false,exhausted=false,landingImpact=0,cameraFollowY=actor.position.y;const velocity=new THREE.Vector3();
  function placeChaseCamera(){
    cameraPosition.copy(cameraOffset).applyAxisAngle(worldUp,actor.rotation.y).add(actor.position);
    lookPosition.copy(lookOffset).applyAxisAngle(worldUp,actor.rotation.y).add(actor.position);
    camera.position.copy(cameraPosition);controls.target.copy(lookPosition);camera.lookAt(lookPosition);
  }
  function enable(value){
    if(value===enabled)return;enabled=value;
    document.body.classList.toggle('walking',value);clearInput();updateHud();
    if(value){savedView={position:camera.position.clone(),target:controls.target.clone(),fov:camera.fov,enabled:controls.enabled,enableDamping:controls.enableDamping,enablePan:controls.enablePan,minDistance:controls.minDistance};camera.fov=innerWidth/innerHeight<1?65:49;camera.updateProjectionMatrix();controls.enabled=true;controls.enablePan=false;controls.enableDamping=false;controls.minDistance=2.8;placeChaseCamera();controls.update();controls.enableDamping=true;}
    else{if(savedView){camera.position.copy(savedView.position);controls.target.copy(savedView.target);camera.fov=savedView.fov;camera.updateProjectionMatrix();camera.lookAt(controls.target);controls.enabled=savedView.enabled;controls.enableDamping=savedView.enableDamping;controls.enablePan=savedView.enablePan;controls.minDistance=savedView.minDistance;savedView=null;}controls.update();}
  }
  function goTo(point){
    path=findPath(actor.position,point,groundHeight,obstacles);
    if(path.length){marker.position.set(point.x,groundHeight(point.x,point.z)+.025,point.z);marker.visible=true;reason='沿岸行走';}
    else {marker.visible=false;reason='请选择岸上的空地';}
  }
  function updateHud(){
    const percent=Math.round(oxygen);
    oxygenValue.textContent=`${percent}%`;oxygenFill.style.width=`${oxygen.toFixed(1)}%`;oxygenTrack.setAttribute('aria-valuenow',String(percent));
    oxygenNote.textContent=oxygen<25?'氧气偏低 · T 背罐转气 / 营地 H 补给':oxygen<60?'宇航服持续耗氧 · 收集气体存入背罐':'生命维持系统正常';
    document.body.classList.toggle('low-oxygen',oxygen<25);
  }
  function clearInput(){keys.clear();velocity.set(0,0,0);path=[];jumpQueued=false;marker.visible=false;runButton?.setAttribute('aria-pressed','false');}
  function setInput(key,pressed){if(!enabled||state.paused)return;if(pressed){keys.add(key);path=[];marker.visible=false;}else keys.delete(key);}
  function addOxygen(amount){oxygen=THREE.MathUtils.clamp(oxygen+amount,0,100);updateHud();}
  function refillOxygen(){addOxygen(100);}
  function respawn(point={x:-2.35,z:2.8},reserve=65){
    clearInput();jumpHeight=0;jumpVelocity=0;jumpStage='ground';jumpClock=0;const before=actor.position.clone();
    actor.position.set(point.x,groundHeight(point.x,point.z)+.012,point.z);
    const delta=actor.position.clone().sub(before);camera.position.add(delta);controls.target.add(delta);cameraFollowY=actor.position.y;stamina=100;exhausted=false;oxygen=reserve;updateHud();
  }
  const keyMap={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
  addEventListener('keydown',e=>{
    if(!state.gameStarted||state.paused||e.target.closest?.('input,textarea,select,dialog'))return;
    if(e.code==='Space'){e.preventDefault();if(!e.repeat)jumpQueued=true;return;}
    if(e.code==='ShiftLeft'||e.code==='ShiftRight'){e.preventDefault();keys.add('run');runButton?.setAttribute('aria-pressed','true');return;}
    const key=keyMap[e.code];if(!key)return;e.preventDefault();setInput(key,true);
  });
  addEventListener('keyup',e=>{keys.delete(keyMap[e.code]);if(e.code==='ShiftLeft'||e.code==='ShiftRight'){keys.delete('run');runButton?.setAttribute('aria-pressed','false');}});
  addEventListener('blur',clearInput);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();});
  runButton?.addEventListener('pointerdown',e=>{if(state.paused)return;e.preventDefault();runButton.setPointerCapture(e.pointerId);setInput('run',true);runButton.setAttribute('aria-pressed','true');});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])runButton?.addEventListener(event,()=>{keys.delete('run');runButton.setAttribute('aria-pressed','false');});
  jumpButton?.addEventListener('click',()=>{if(enabled&&!state.paused)jumpQueued=true;});
  function update(dt){
    const previousJump=jumpHeight,before=actor.position.clone(),direction=new THREE.Vector3();
    if(enabled&&!state.paused){
      if(keys.has('up')||keys.has('down')||keys.has('left')||keys.has('right')){
        camera.getWorldDirection(direction);direction.y=0;direction.normalize();const right=new THREE.Vector3(-direction.z,0,direction.x);
        const forward=Number(keys.has('up'))-Number(keys.has('down')),side=Number(keys.has('right'))-Number(keys.has('left'));
        direction.multiplyScalar(forward).addScaledVector(right,side).normalize();
      }else if(path.length){
        const target=path[0];direction.set(target.x-actor.position.x,0,target.z-actor.position.z);
        if(direction.length()<.09){path.shift();direction.set(0,0,0);}else direction.normalize();
      }
      if(!keys.has('run'))exhausted=false;
      sprinting=keys.has('run')&&!exhausted&&stamina>1&&direction.lengthSq()>.01;
      stamina=THREE.MathUtils.clamp(stamina+(sprinting?-27:18)*dt,0,100);if(stamina<1)exhausted=true;
      const speed=sprinting?3.5:1.55;velocity.lerp(direction.clone().multiplyScalar(speed),1-Math.exp(-dt*(direction.lengthSq()?9:15)));
      const dx=velocity.x*dt,dz=velocity.z*dt;
      let nx=actor.position.x+dx,nz=actor.position.z+dz;
      if(canStand(nx,nz,groundHeight,obstacles,jumpHeight)){actor.position.x=nx;actor.position.z=nz;}
      else if(canStand(nx,actor.position.z,groundHeight,obstacles,jumpHeight))actor.position.x=nx;
      else if(canStand(actor.position.x,nz,groundHeight,obstacles,jumpHeight))actor.position.z=nz;
      else if(direction.lengthSq()){path=[];reason='岸线或障碍物，请换个方向';}
    }
    if(enabled&&!state.paused&&jumpQueued&&jumpStage==='ground'){jumpStage='anticipate';jumpClock=0;reason='准备起跳';}
    if(!state.paused){jumpQueued=false;if(jumpStage!=='ground')jumpClock+=dt;
      if(jumpStage==='anticipate'&&jumpClock>=.16){jumpStage='air';jumpClock=0;jumpVelocity=4.35;}
      if(jumpStage==='air'){jumpHeight=Math.max(0,jumpHeight+jumpVelocity*dt);jumpVelocity-=12.2*dt;if(jumpHeight===0&&jumpVelocity<0){jumpVelocity=0;landingImpact=1;jumpStage='land';jumpClock=0;reason='落地';if(!canStand(actor.position.x,actor.position.z,groundHeight,obstacles)){let resolved=false;for(let radius=.15;radius<1.6&&!resolved;radius+=.15)for(let k=0;k<16;k++){const x=actor.position.x+Math.cos(k*Math.PI/8)*radius,z=actor.position.z+Math.sin(k*Math.PI/8)*radius;if(canStand(x,z,groundHeight,obstacles)){actor.position.x=x;actor.position.z=z;resolved=true;break;}}}}}
      if(jumpStage==='land'&&jumpClock>=.24){jumpStage='ground';jumpClock=0;}
    }
    actor.position.y=groundHeight(actor.position.x,actor.position.z)+.012+jumpHeight;
    const delta=actor.position.clone().sub(before),distance=Math.hypot(delta.x,delta.z);motion.copy(delta).multiplyScalar(1/Math.max(dt,.0001));motionSpeed=motion.length();travel+=distance;
    if(enabled){camera.position.x+=delta.x;camera.position.z+=delta.z;controls.target.x+=delta.x;controls.target.z+=delta.z;const nextY=THREE.MathUtils.damp(cameraFollowY,actor.position.y-jumpHeight*.65,12,dt);camera.position.y+=nextY-cameraFollowY;controls.target.y+=nextY-cameraFollowY;cameraFollowY=nextY;}
    const moving=distance>.0001;blend=THREE.MathUtils.damp(blend,moving?1:0,10,dt);
    const running=sprinting;
    if(enabled&&!state.paused){
      const drain=oxygenDrain({moving,running,airborne:jumpHeight>.05});
      oxygen=Math.max(0,oxygen-drain*dt);
    }
    if(moving){phase+=dt*(running?9.2:6.1);heading=Math.atan2(-delta.x,-delta.z);if(jumpHeight<.05)reason=running?'奔跑中':'行走中';}
    const turn=Math.atan2(Math.sin(heading-actor.rotation.y),Math.cos(heading-actor.rotation.y));actor.rotation.y+=turn*(1-Math.exp(-dt*10));
    if(!state.paused){landingImpact=THREE.MathUtils.damp(landingImpact,0,12,dt);animation.update(dt,{speed:distance/Math.max(dt,.001),jumpStage,jumpPhase:THREE.MathUtils.clamp(jumpClock/(jumpStage==='anticipate'?.16:jumpStage==='air'?.713:.24),0,1),landing:landingImpact});}
    if(!path.length)marker.visible=false;
    statusTime+=dt;
    if(statusTime>.25){statusTime=0;status.dataset.x=actor.position.x.toFixed(2);status.dataset.z=actor.position.z.toFixed(2);status.textContent=(state.paused?'动画已暂停':jumpHeight>.045?'腾空中':moving?reason:['行走中','奔跑中'].includes(reason)?'已抵达':reason)+' · '+travel.toFixed(1)+' m';if(enabled){updateHud();document.querySelector('#stamina-fill').style.width=stamina.toFixed(0)+'%';}}
  }
  return {actor,body,animation,face(x,z){heading=Math.atan2(actor.position.x-x,actor.position.z-z);actor.rotation.y=heading;},update,enable,goTo,clearInput,setInput,addOxygen,refillOxygen,respawn,get enabled(){return enabled;},get distance(){return travel;},get motion(){return motion;},get motionSpeed(){return motionSpeed;},get oxygen(){return oxygen;},get stamina(){return stamina;},get airborne(){return jumpHeight>.01;},obstacles};
}
