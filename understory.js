import * as THREE from 'three';
import {STORY_NODES} from './story-data.js';

// Deterministic ecological patches across the entire island, not a spawn-centred scatter.
export async function createUnderstory({scene,loader,groundHeight,valueNoise,windMaterial,obstacles}){
 let seed=73129;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const [grasses,bushes,ferns]=await Promise.all([
  loader.loadAsync('./assets/grass/grass.gltf'),
  loader.loadAsync('./assets/story/cc0/plant_bushDetailed.glb'),
  loader.loadAsync('./assets/story/cc0/grass_leafsLarge.glb')
 ]);
 const clearings=STORY_NODES.map(n=>[n.x,n.z,n.type==='plant'?1.05:2.9]);
 clearings.push([-2.5,6.4,4],[-5,29,1.9],[6.1,6.8,1.4],[-16,23,1.8],[15,39,1.8],[10,12,1.5]);
 const paths=[[-2.5,5.2,-4.8,7],[-4.8,7,-11,20],[-11,20,-18,34],[-2.5,5.2,11,29],[11,29,15,39],[-11,20,-5,29]];
 function pathDistance(x,z){let best=Infinity;for(const[a,b,c,d]of paths){const t=THREE.MathUtils.clamp(((x-a)*(c-a)+(z-b)*(d-b))/((c-a)**2+(d-b)**2),0,1);best=Math.min(best,Math.hypot(x-a-t*(c-a),z-b-t*(d-b)));}return best;}
 function allowed(x,z){
  const y=groundHeight(x,z);if(y<.10)return false;
  if(Math.abs(x+18)<6.3&&z>32&&z<54)return false;
  if(clearings.some(([a,b,r])=>Math.hypot(x-a,z-b)<r))return false;
  if(obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.18))return false;
  return true;
 }
 function part(mesh,height,kind){
  // Sources are laid out on a catalogue grid. Normalize each mesh around its own base.
  const geo=mesh.geometry.clone();geo.computeBoundingBox();const box=geo.boundingBox,center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  geo.translate(-center.x,-box.min.y,-center.z);geo.scale(height/size.y,height/size.y,height/size.y);geo.computeBoundingSphere();
  const material=windMaterial(mesh.material.clone(),'grass');material.metalness=0;material.roughness=.92;material.envMapIntensity=.58;material.color.setHex(kind==='grass'?0xb9c89a:kind==='bush'?0x849b68:0x809c75);material.side=THREE.DoubleSide;material.normalScale?.set(.25,.25);
  return {geo,material,kind};
 }
 const variants=[];grasses.scene.traverse(o=>{if(o.isMesh&&/tall_[abc]|tiny_[abcdef]/.test(o.name))variants.push(part(o,/tall/.test(o.name)?.53:.24,'grass'));});
 const bushParts=[],fernParts=[];bushes.scene.traverse(o=>{if(o.isMesh)bushParts.push(part(o,.85,'bush'));});ferns.scene.traverse(o=>{if(o.isMesh)fernParts.push(part(o,.52,'fern'));});
 const patches=new Map(),dummy=new THREE.Object3D();let grassCount=0,shrubCount=0;
 function add(source,x,z,size,angle,tone){const key=Math.floor(x/24)+','+Math.floor(z/24)+','+source.kind+','+source.geo.uuid;if(!patches.has(key))patches.set(key,{source,list:[]});patches.get(key).list.push([x,groundHeight(x,z)-.015,z,size,angle,tone]);}
 // Jittered cells keep even area coverage; a low-frequency field creates broad meadow islands.
 for(let x=-56;x<57;x+=.72)for(let z=-17;z<77;z+=.72){
  const px=x+rand()*.72,pz=z+rand()*.72;if(!allowed(px,pz))continue;
  const meadow=valueNoise(px*.065,11,pz*.065),fine=valueNoise(px*.23,7,pz*.23),trail=pathDistance(px,pz);
  const density=(.32+.62*THREE.MathUtils.smoothstep(meadow,.22,.68))*(trail<.85?.04:trail<1.45?.32:1);
  if(rand()>density)continue;
  const source=variants[Math.floor(rand()*variants.length)],scale=.75+rand()*.7;
  add(source,px,pz,scale,rand()*Math.PI*2,.86+fine*.22);grassCount++;
  // Companion tufts make overlapping clumps with gaps between them.
  if(rand()<.65&&trail>1.3){const qx=px+(rand()-.5)*.45,qz=pz+(rand()-.5)*.45;if(allowed(qx,qz)){add(source,qx,qz,scale*.72,rand()*Math.PI*2,.93);grassCount++;}}
 }
 // Mid-height cover sits in groves and meadow edges, with no initial-camera density bias.
 for(let i=0;i<820;i++){
  const x=-54+rand()*108,z=-9+rand()*85;if(!allowed(x,z)||pathDistance(x,z)<1.8)continue;
  const habitat=valueNoise(x*.055,19,z*.055);if(habitat<.48)continue;
  const sources=i%3?bushParts:fernParts;
  for(const source of sources)add(source,x,z,.65+rand()*.85,rand()*6.283,.84+rand()*.23);
  shrubCount++;
 }
 for(const{source,list}of patches.values()){
  const mesh=new THREE.InstancedMesh(source.geo,source.material,list.length);mesh.name='ECOLOGY_'+source.kind.toUpperCase();
  list.forEach(([x,y,z,size,angle,tone],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);dummy.scale.set(size*(.85+rand()*.25),size,size*(.85+rand()*.25));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new THREE.Color(tone,tone,tone));});
  mesh.castShadow=source.kind!=='grass';mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);
 }
 return {grassCount,shrubCount,variants:variants.length};
}
