import * as THREE from 'three';
import {asset,instance,materials} from './asset-library.js';
export const CAMP={id:'camp',type:'camp',name:'零号营地 · 氧气回收站',x:-2.5,z:5.2};
export const CAVE={x:-18,z:43,radius:4.6,length:17};
export const FIELD_NODES=[
 {id:'wreck-tank',type:'salvage',x:6.1,z:6.8,name:'坠毁货舱 · 应急氧气罐'},
 {id:'lung-a',type:'lung',x:-16,z:23,name:'共生肺囊 · 露液换气'},
 {id:'vent-a',type:'vent',x:10,z:12,name:'潮汐气孔 · 压力取气'},
 {id:'cave-siphon',type:'siphon',x:-18,z:46,name:'蓝脉菌床 · 蓝息质集氧床'},
 {id:'lung-b',type:'lung',x:15,z:39,name:'骨林肺囊 · 露液换气'}
];
export async function createFieldWorld({scene,loader,walker,world,groundHeight}){
 const names=['oxygen-tank','collector','camp-station','lung-plant','fan-plant','coastal-cliff','cave-chamber'];
 const sources=Object.fromEntries(await Promise.all(names.map(async n=>[n,await asset(loader,n)])));
 const rocks=(await loader.loadAsync('./assets/rocks/rock_moss_set_01_4k.gltf')).scene;
 const group=new THREE.Group();group.name='FIELD_ECOLOGY_AND_CAMP';scene.add(group);
 function put(name,x,z,h,rotation=0,y=groundHeight(x,z),parent=group){const o=instance(sources[name],h,{rotation});o.name=name;o.position.set(x,y,z);parent.add(o);return o;}
 function label(text,sub,w=2.2){const c=document.createElement('canvas');c.width=768;c.height=256;const q=c.getContext('2d');q.fillStyle='#182627';q.fillRect(0,0,768,256);q.fillStyle='#aac9b5';q.fillRect(32,28,60,5);q.font='bold 47px sans-serif';q.fillText(text,32,112);q.font='25px sans-serif';q.fillStyle='#a4b2a4';q.fillText(sub,32,183);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const o=new THREE.Mesh(new THREE.PlaneGeometry(w,w/3),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));o.rotation.y=Math.PI;group.add(o);return o;}
 const station=put('camp-station',CAMP.x,CAMP.z+1.8,2.8,Math.PI);station.name='MESHY_CAMP_RECHARGE_STATION';
 // Preserve the imported PBR texture; only its bright warm indicator pixels emit light.
 materials(station,m=>{m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float warmIndicator=smoothstep(.34,.70,diffuseColor.r)*smoothstep(.12,.34,diffuseColor.r-diffuseColor.b);totalEmissiveRadiance+=vec3(2.8,1.05,.25)*warmIndicator;`);};m.customProgramCacheKey=()=> 'camp-warm-indicators-v1';});
 const rack=[];for(let i=0;i<3;i++)rack.push(put('oxygen-tank',CAMP.x-2.0+i*.45,CAMP.z+1.3,.95,Math.PI));
 put('collector',CAMP.x+2.0,CAMP.z+1,.6,Math.PI);
 const sign=label('零号营地','保持 E 插罐  /  H 补给  /  R 通信');sign.position.set(CAMP.x,groundHeight(CAMP.x,CAMP.z)+2.9,CAMP.z+1.5);
 const campLight=new THREE.PointLight(0xffd2a5,5,6,2);campLight.position.set(CAMP.x,groundHeight(CAMP.x,CAMP.z)+2.4,CAMP.z);group.add(campLight);
 walker.obstacles.push({x:CAMP.x,z:CAMP.z+2,r:1.6,h:2.8},{x:CAMP.x-1.6,z:CAMP.z+1.3,r:.65,h:.95});
 // Rigid imported equipment follows the existing attachment bones.
 const carry=new THREE.Group();carry.name='CARRIED_OXYGEN_CYLINDERS';walker.actor.add(carry);
 for(const x of[-.25,.25]){const t=instance(sources['oxygen-tank'],.61);t.position.set(x,.78,.33);carry.add(t);}walker.animation.mount(carry,'Spine');
 const pump=instance(sources.collector,.38);pump.position.set(.38,.68,-.15);walker.actor.add(pump);pump.visible=false;walker.animation.mount(pump,'RightHand');
 const nodes=FIELD_NODES.map(n=>({...n}));world.nodes.push({...CAMP,object:station},...nodes);const organs=[];
 for(const n of nodes){let o;if(n.type==='lung'){o=put('lung-plant',n.x,n.z,2.25,n.x*.13);organs.push({mesh:o,base:o.scale.clone(),seed:n.x});}
  else if(n.type==='salvage')o=put('oxygen-tank',n.x,n.z,.95,.45);
  else if(n.type==='siphon'){o=put('collector',n.x,n.z,.7);o.visible=false;}
  else{o=instance(rocks,.65);o.position.set(n.x,groundHeight(n.x,n.z)-.12,n.z);group.add(o);const l=new THREE.PointLight(0x8bbfa7,2,2);l.position.set(n.x,groundHeight(n.x,n.z)+.2,n.z);group.add(l);}
  n.object=o;
 }
 // Downloaded CC0 chamber: original UVs, stone albedo and normal map are embedded.
 const cavern=sources['cave-chamber'].clone(true);cavern.name='ENTERABLE_CAVE';cavern.position.set(CAVE.x,groundHeight(CAVE.x,CAVE.z)-.10,CAVE.z);group.add(cavern);materials(cavern,m=>{m.side=THREE.DoubleSide;m.envMapIntensity=.25;});cavern.updateMatrixWorld(true);
 // Derive side blockers from the imported cave wall at body height.
 const ray=new THREE.Raycaster();for(let z=35;z<=51;z+=.65)for(const side of[-1,1]){ray.set(new THREE.Vector3(CAVE.x,cavern.position.y+1.1,z),new THREE.Vector3(side,0,0));const hit=ray.intersectObject(cavern,true)[0];if(hit&&hit.distance<8)walker.obstacles.push({x:hit.point.x,z,r:.36,h:6});}
 const caveSign=label('蓝脉洞窟','避风  /  放置抽气器，再回来收罐',2.6);caveSign.position.set(CAVE.x-3.6,groundHeight(CAVE.x,CAVE.z)+1.5,33.6);caveSign.rotation.y=Math.PI+.3;
 for(let k=0;k<3;k++){const l=new THREE.PointLight(0x9acbc3,4,7,2);l.position.set(CAVE.x,groundHeight(CAVE.x,CAVE.z)+1.8,38+k*4);group.add(l);}
 for(let k=0;k<8;k++){const colony=put('fan-plant',CAVE.x+Math.sin(k*2.9)*3.2,37+k*1.6,.3+(k%3)*.12,k);materials(colony,m=>{m.emissive.setHex(0x57d7ca);m.emissiveMap=m.map;m.emissiveIntensity=1.15;});}
 // Keep the scanned cliff's natural proportions, but bound its footprint.
 // This source is almost nine times wider than tall: height alone cannot size a backdrop.
 function landscapeCliff(x,z,height,rotation,maxSpan,name){
  const o=put('coastal-cliff',x,z,height,rotation,-3);
  const size=new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
  o.scale.multiplyScalar(Math.min(1,maxSpan/Math.max(size.x,size.z)));
  o.name=name;o.updateMatrixWorld(true);return o;
 }
 for(const[x,z,h,r]of[[-90,70,16,Math.PI/2],[-108,138,22,Math.PI/2],[92,78,17,-Math.PI/2],[118,145,21,-Math.PI/2],[-24,165,20,Math.PI],[55,180,18,Math.PI]]){
  landscapeCliff(x,z,h,r,105,'CC0_OUTER_ISLAND_RIDGE');
 }
 // Low outcrops frame the playable cave; the imported chamber supplies its actual walls.
 landscapeCliff(-26,46,10,Math.PI/2,32,'CC0_CAVE_OUTCROP');
 landscapeCliff(-9,48,9,-Math.PI/2,28,'CC0_CAVE_OUTCROP');
 // Leave an uninterrupted lake and sky between the player and the distant shoreline.
 for(const[x,z,h,r]of[[-430,-1050,60,.12],[420,-1250,80,-.15],[-780,-1500,95,.25]]){
  const o=landscapeCliff(x,z,h,r,650,'CC0_DISTANT_SHORE');o.position.y=-8;
  o.traverse(mesh=>{if(mesh.isMesh){mesh.castShadow=false;mesh.receiveShadow=false;}});
 }
 const colonies=[[-12,10,2.2],[-22,18,3.2],[8,21,2.6],[18,24,3.5],[-26,29,4],[23,42,4.8],[-7,44,2.8],[7,48,5],[20,15,2.4],[-29,38,3.4]];
 for(const[x,z,h]of colonies){put('fan-plant',x,z,h,x*.6);walker.obstacles.push({x,z,r:.35,h});}
 const trail=label('营地 ←    洞窟 ↑','先观察，再取用。别把肺交给广告。',2.4);trail.position.set(-8,groundHeight(-8,24)+1.2,24);
 return {group,camp:CAMP,cave:CAVE,isSheltered(p){return Math.abs(p.x-CAVE.x)<4&&Math.abs(p.z-CAVE.z)<8.3||Math.hypot(p.x-CAMP.x,p.z-CAMP.z)<3.6;},update(time,game){organs.forEach(o=>o.mesh.scale.copy(o.base).multiplyScalar(1+Math.sin(time*1.3+o.seed)*.025));pump.visible=!!game.harvesting;for(let i=0;i<rack.length;i++)rack[i].visible=game.delivered>0&&i<Math.ceil(game.reserve/40);if(game.insertedAt!==undefined){const t=Math.min(1,(time-game.insertedAt)/1.2);rack[0].position.y=groundHeight(CAMP.x,CAMP.z)+.3*(1-t);}for(const n of nodes)if(n.type==='siphon')n.object.visible=!!game.deployments[n.id];else if(n.type==='salvage')n.object.visible=!game.salvaged?.has?.(n.id);}};
}
