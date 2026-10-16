import * as THREE from 'three';
import {asset,instance,materials} from './asset-library.js';
import {STORY_NODES} from './story-data.js';
import {canStand} from './walker.js?v=20261015-survival';

export async function createStoryWorld({scene,loader,groundHeight,walker}){
 const group=new THREE.Group();group.name='OXYGEN_EXPEDITION';scene.add(group);
 const nodes=STORY_NODES.map(n=>({...n,choices:n.choices.map(c=>({...c})),object:null}));
 const assets={},assetStatus={};
 const [fan,lung]=await Promise.all([asset(loader,'fan-plant'),asset(loader,'lung-plant')]);
 for(const [key,name]of Object.entries({'column-large':'ruin-column','stone-wall-damaged':'ruin-wall',debris:'ruin-debris','altar-stone':'ruin-base'})){assets[key]=await asset(loader,name);assetStatus[key]='loaded';}
 function place(model,x,z,height,rotation=0,unused=null,collision=true){
  const wrap=instance(model,height,{rotation});wrap.position.set(x,groundHeight(x,z)-.025,z);group.add(wrap);
  if(collision){const size=new THREE.Box3().setFromObject(wrap).getSize(new THREE.Vector3());walker.obstacles.push({x,z,r:Math.min(1.25,Math.max(size.x,size.z)*.36),h:height});}return wrap;
 }
 function plinth(x,z){return place(assets['altar-stone'],x,z,.84,0);}
 function plaque(node,x,z){
  const c=document.createElement('canvas');c.width=512;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#202c26';ctx.fillRect(0,0,512,192);ctx.fillStyle='#d8c69d';ctx.font='16px sans-serif';ctx.fillText('EARTH ARCHIVE / 2486',25,39);ctx.font='bold 25px sans-serif';ctx.fillText(node.name,25,88);ctx.fillStyle='#a9b4a2';ctx.font='17px sans-serif';ctx.fillText(node.type==='relay'?'O₂  BIO-REACTOR':'地球记忆馆 · 未来虚构档案',25,137);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(1,.375),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));m.position.set(x,groundHeight(x,z)+.63,z-.48);m.rotation.set(.28,Math.PI,0);group.add(m);
 }
 function plant(node){
  const source=node.species==='dew'?lung:fan;
  const height=node.species==='moss'?.38:node.species==='dew'?.9:.72;
  const root=place(source,node.x,node.z,height,node.x*.2,null,false);
  const tint={silver:0xb4c8b2,dew:0xaac0a0,moss:0x649e9c,red:0xb55d4b};
  materials(root,m=>{m.emissive.setHex(tint[node.species]);m.emissiveIntensity=.08;if(!node.glow)node.glow=m;});node.object=root;root.userData.restScaleY=root.scale.y;
 }
 for(const node of nodes){
  // Find a walkable clearing close to the authored location; never hide pickups inside collision geometry.
  const ox=node.x,oz=node.z;let found=false;
  for(let radius=0;radius<=4&&!found;radius+=.5)for(let k=0;k<16;k++){const a=k*Math.PI/8,x=ox+Math.cos(a)*radius,z=oz+Math.sin(a)*radius;if(canStand(x,z,groundHeight,walker.obstacles)){node.x=x;node.z=z;found=true;break;}}
  if(node.type==='plant'){plant(node);continue;}
  const x=node.x,z=node.z+1.7;
  if(assets['stone-wall-damaged'])place(assets['stone-wall-damaged'],x-2.4,z+1.3,1.5,.4);
  if(assets['column-large'])place(assets['column-large'],x+2,z+1,2.1,.05);
  if(assets.debris)place(assets.debris,x-1.5,z+.7,.35,1.5,null,false);
  if(node.type==='archive'){
   const pedestal=plinth(x,z);plaque(node,x,z+.03);
   try{
    const portrait=(await loader.loadAsync(`./assets/story/portraits/${node.portrait}.glb`)).scene;
    const bust=place(portrait,x,z,1.05,Math.PI,null,false);bust.position.y+=.84;node.object=bust;assetStatus[node.id]='loaded';
   }catch{node.object=pedestal;assetStatus[node.id]='unavailable';}
  }else{
   node.object=assets['altar-stone']?place(assets['altar-stone'],x,z,1.1,0,null):plinth(x,z);plaque(node,x,z+.1);
   materials(node.object,m=>{m.emissive.setHex(0x62e7cc);m.emissiveIntensity=.08;if(!node.glow)node.glow=m;});
  }
 }
 return {nodes,group,assetStatus,scanUntil:0,update(time,progress){for(const n of nodes){if(n.glow){const depleted=(progress.cooldowns.get(n.id)||0)>time;n.glow.emissiveIntensity=depleted?.025:time<this.scanUntil?1.4:n.type==='relay'&&progress.complete?1:.18+Math.sin(time*1.5+n.x)*.07;}}}};
}
