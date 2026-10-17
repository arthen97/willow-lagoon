import * as THREE from 'three';
import {asset,instance,materials} from './asset-library.js';
import {STORY_NODES} from './story-data.js';
import {canStand} from './walker.js?v=20261015-survival';

export async function createStoryWorld({scene,loader,groundHeight,walker}){
 const group=new THREE.Group();group.name='OXYGEN_EXPEDITION';scene.add(group);
 const nodes=STORY_NODES.map(n=>({...n,choices:n.choices.map(c=>({...c})),object:null}));
 const assets={},assetStatus={};
 const [fan,lung]=await Promise.all([asset(loader,'fan-plant'),asset(loader,'lung-plant')]);
 for(const key of ['column-large','stone-wall-damaged','debris','altar-stone']){assets[key]=(await loader.loadAsync(`./assets/story/cc0/${key}.glb`)).scene;assetStatus[key]='loaded';}
 function place(model,x,z,height,rotation=0,unused=null,collision=true){
  const wrap=instance(model,height,{rotation});wrap.position.set(x,groundHeight(x,z)-.025,z);group.add(wrap);
  // Seat the entire footprint into the slope, including the back edge of broad masonry.
  const bounds=new THREE.Box3().setFromObject(wrap);
  const floor=Math.min(groundHeight(x,z),...[[bounds.min.x,bounds.min.z],[bounds.min.x,bounds.max.z],[bounds.max.x,bounds.min.z],[bounds.max.x,bounds.max.z]].map(([a,b])=>groundHeight(a,b)));
  wrap.position.y+=floor-.035-bounds.min.y;
  materials(wrap,m=>{m.metalness=0;m.roughness=.91;});
  if(collision){const size=new THREE.Box3().setFromObject(wrap).getSize(new THREE.Vector3());walker.obstacles.push({x,z,r:Math.min(1.25,Math.max(size.x,size.z)*.36),h:height});}return wrap;
 }
 function plinth(x,z){return place(assets['altar-stone'],x,z,.78,0);}
 function plaque(node,pedestal){
  const box=new THREE.Box3().setFromObject(pedestal),center=box.getCenter(new THREE.Vector3());
  const c=document.createElement('canvas');c.width=512;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#202c26';ctx.fillRect(0,0,512,192);ctx.fillStyle='#d8c69d';ctx.font='16px sans-serif';ctx.fillText('EARTH ARCHIVE / 2486',25,39);ctx.font='bold 25px sans-serif';ctx.fillText(node.name,25,88);ctx.fillStyle='#a9b4a2';ctx.font='17px sans-serif';ctx.fillText(node.type==='relay'?'O₂  BIO-REACTOR':'地球记忆馆 · 未来虚构档案',25,137);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(1,.375),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));m.position.set(center.x,box.min.y+(box.max.y-box.min.y)*.52,box.min.z-.012);m.rotation.set(0,Math.PI,0);group.add(m);
 }
 function plant(node){
  const source=node.species==='dew'?lung:fan;
  const height=node.species==='moss'?.38:node.species==='dew'?.9:.72;
  const root=place(source,node.x,node.z,height,node.x*.2,null,false);
  const tint={silver:0xb4c8b2,dew:0xaac0a0,moss:0x649e9c,red:0xb55d4b};
  node.glowMaterials=[];materials(root,m=>{m.emissive.setHex(node.species==='red'?tint.red:0x77ddd0);m.emissiveMap=m.emissiveMap||m.map;m.emissiveIntensity=node.species==='red'?.12:.85;node.glowMaterials.push(m);if(!node.glow)node.glow=m;});node.object=root;root.userData.restScaleY=root.scale.y;
 }
 for(const node of nodes){
  // Find a walkable clearing close to the authored location; never hide pickups inside collision geometry.
  const ox=node.x,oz=node.z;let found=false;
  for(let radius=0;radius<=4&&!found;radius+=.5)for(let k=0;k<16;k++){const a=k*Math.PI/8,x=ox+Math.cos(a)*radius,z=oz+Math.sin(a)*radius;if(canStand(x,z,groundHeight,walker.obstacles)){node.x=x;node.z=z;found=true;break;}}
  if(node.type==='plant'){plant(node);continue;}
  const x=node.x,z=node.z+1.7;
  const site=nodes.filter(n=>n.type!=='plant').indexOf(node),angle=[-.22,.18,-.36,.28,0][site%5];
  const at=(dx,dz)=>[x+dx*Math.cos(angle)-dz*Math.sin(angle),z+dx*Math.sin(angle)+dz*Math.cos(angle)];
  // A rear wall and one surviving pillar frame the exhibit; the front stays approachable.
  place(assets['stone-wall-damaged'],...at(-1.15,1.5),1.15,angle);
  place(assets['column-large'],...at(1.55,1.35),1.75+(site%2)*.25,angle);
  place(assets.debris,...at(-1.7,.8),.23,angle+.7,null,false);
  if(node.type==='archive'){
   const pedestal=plinth(x,z);plaque(node,pedestal);
   try{
    const portrait=(await loader.loadAsync(`./assets/story/portraits/${node.portrait}.glb`)).scene;
    const bust=place(portrait,x,z,.64,Math.PI,null,false);bust.position.y=new THREE.Box3().setFromObject(pedestal).max.y-.015;node.object=bust;assetStatus[node.id]='loaded';
   }catch{node.object=pedestal;assetStatus[node.id]='unavailable';}
  }else{
   node.object=assets['altar-stone']?place(assets['altar-stone'],x,z,1.1,0,null):plinth(x,z);plaque(node,node.object);
   materials(node.object,m=>{m.emissive.setHex(0x62e7cc);m.emissiveIntensity=.08;if(!node.glow)node.glow=m;});
  }
 }
 const chips=[];let worldTime=0;
 function hitStatue(node){
  if(!node?.object||node.type!=='archive')return;
  node.hitAt=worldTime;node.restRotation??=node.object.rotation.clone();
  const debris=assets.debris;
  for(let i=0;i<5;i++){
   const bit=instance(debris,.035+Math.random()*.045);bit.position.copy(node.object.position);bit.position.y+=.45+Math.random()*.5;
   bit.userData.velocity=new THREE.Vector3((Math.random()-.5)*2.7,1+Math.random()*1.5,(Math.random()-.5)*2.7);bit.userData.born=worldTime;
   bit.traverse(o=>{if(o.isMesh)o.castShadow=false;});group.add(bit);chips.push(bit);
  }
 }
 return {nodes,group,assetStatus,hitStatue,scanUntil:0,update(time,progress){
 const dt=Math.min(.05,Math.max(0,time-worldTime));worldTime=time;
 for(const n of nodes)if(n.restRotation){const age=time-n.hitAt;n.object.rotation.copy(n.restRotation);if(age<1){const wobble=Math.sin(age*34)*Math.exp(-age*6)*.12;n.object.rotation.z+=wobble;n.object.rotation.x+=wobble*.6;}}
 for(let i=chips.length-1;i>=0;i--){const bit=chips[i],age=time-bit.userData.born;bit.userData.velocity.y-=dt*6;bit.position.addScaledVector(bit.userData.velocity,dt);bit.rotation.x+=dt*4;bit.rotation.z+=dt*3;bit.scale.multiplyScalar(Math.exp(-dt*1.6));if(age>1.3){group.remove(bit);bit.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))m.dispose();});chips.splice(i,1);}}
for(const n of nodes){if(n.glow){const depleted=(progress.cooldowns.get(n.id)||0)>time;const strength=depleted?.05:n.species==='red'?.15:n.type==='plant'?(time<this.scanUntil?1.8:.85+Math.sin(time*1.5+n.x)*.10):n.type==='relay'&&progress.complete?1.8:.3;for(const m of n.glowMaterials||[n.glow])m.emissiveIntensity=strength;}}}};
}
