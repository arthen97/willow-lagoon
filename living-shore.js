import * as THREE from 'three';
import {asset,instance,materials} from './asset-library.js';
import {canStand} from './walker.js?v=20261015-survival';
export async function createLivingShore({scene,loader,world,walker,groundHeight}){
 const [colony,frond,collector]=await Promise.all(['shore-colony','root-frond','collector'].map(n=>asset(loader,n)));
 const group=new THREE.Group();group.name='CC0_LIVING_SHORE';scene.add(group);
 const wound={id:'root-wound',type:'wound',name:'旧采集泵 · 受损根床',x:-5,z:29},lake={id:'lake-listen',type:'listen',name:'湖岸观测点 · 潮汐的起伏',x:-14,z:2};
 for(const node of [wound,lake]){const ox=node.x,oz=node.z;let found=false;for(let r=0;r<=6&&!found;r+=.5)for(let k=0;k<16;k++){const x=ox+Math.cos(k*Math.PI/8)*r,z=oz+Math.sin(k*Math.PI/8)*r;if(canStand(x,z,groundHeight,walker.obstacles)){node.x=x;node.z=z;found=true;break;}}}
 function place(source,x,z,h){const o=instance(source,h);o.position.set(x,groundHeight(x,z)+.01,z);group.add(o);return o;}
 wound.object=place(collector,wound.x+.9,wound.z,1);wound.object.rotation.z=.18;
 lake.object=place(colony,lake.x+.8,lake.z,.40);world.nodes.push(wound,lake);
 const forms=[];
 for(let i=0;i<18;i++){const t=i/17,x=THREE.MathUtils.lerp(wound.x,lake.x,t)+Math.sin(i*2.4)*1.5,z=THREE.MathUtils.lerp(wound.z,lake.z,t);const o=place(i%3?frond:colony,x,z,.18+(i%3)*.10);o.rotation.y=i*2.1;const mats=[];materials(o,m=>{m.color.multiply(new THREE.Color(.76,.91,.82));m.emissive.setHex(0x4eaa9b);m.emissiveIntensity=.04;mats.push(m);});forms.push({o,base:o.scale.clone(),mats,t});}
 const rootLight=new THREE.PointLight(0xdb9c64,.4,4),shoreLight=new THREE.PointLight(0x86c9bc,.3,5);rootLight.position.set(wound.x,groundHeight(wound.x,wound.z)+.5,wound.z);shoreLight.position.set(lake.x,groundHeight(lake.x,lake.z)+.6,lake.z);group.add(rootLight,shoreLight);
 let restoration=0;
 return {update(time,game,dt=.016){restoration=THREE.MathUtils.damp(restoration,game.rootRestored?1:0,1.4,dt);rootLight.intensity=.4*(1-restoration);shoreLight.intensity=.3+restoration*.55;for(const f of forms){const pulse=(Math.sin(time*1.3-f.t*8)+1)*.5;f.o.scale.copy(f.base);f.o.scale.y*=.56+restoration*.39+pulse*(.025+restoration*.08);for(const m of f.mats)m.emissiveIntensity=.025+restoration*(.12+pulse*.65);}wound.object.rotation.z=.18+(game.rootRestored?0:Math.sin(time*22)*.006);lake.object.scale.y=lake.object.scale.x*(.93+Math.sin(time*1.3-8)*.07);}};
}
