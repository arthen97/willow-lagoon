import * as THREE from 'three';
const cache=new Map();
export async function asset(loader,name){
 if(!cache.has(name))cache.set(name,loader.loadAsync(`./assets/world/${name}.glb`).then(g=>g.scene));
 return cache.get(name);
}
export function instance(source,height=1,{rotation=0}={}){
 const object=source.clone(true),box=new THREE.Box3().setFromObject(object),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 object.position.sub(new THREE.Vector3(center.x,box.min.y,center.z));
 const root=new THREE.Group();root.add(object);root.scale.setScalar(height/Math.max(.001,size.y));root.rotation.y=rotation;
 object.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const copy=m=>{const n=m.clone();n.envMapIntensity=.65;for(const key of ['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(n[key])n[key].anisotropy=4;return n;};o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);});
 return root;
}
export function materials(root,fn){root.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))fn(m);});}
