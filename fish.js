import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export function createFishSchools({scene,groundHeight,rand,state,water,camera,controls,walker}){
  const time={value:0},body=new THREE.SphereGeometry(1,12,8);body.scale(.075,.085,.30);
  const tail=new THREE.BufferGeometry();tail.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.22,0,.15,.44,0,-.15,.44,0,.025,.13,.11,-.04,.23,-.11,-.04,.23],3));tail.setIndex([0,1,2,3,4,5]);tail.computeVertexNormals();tail.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(12).fill(0),2));
  const geo=mergeGeometries([body,tail]),mat=new THREE.MeshStandardMaterial({color:0x9cb09b,metalness:.13,roughness:.38,side:THREE.DoubleSide});
  mat.onBeforeCompile=s=>{s.uniforms.fishTime=time;s.vertexShader='uniform float fishTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(fishTime*8.+position.z*9.+instanceMatrix[3].x)*.055*smoothstep(-.08,.44,position.z);');};
  // Dark dorsal side, silver belly and small eyes retain detail in shallow water.
  const tint=new Float32Array(geo.attributes.position.count*3);
  for(let i=0;i<geo.attributes.position.count;i++){
    const y=geo.attributes.position.getY(i),z=geo.attributes.position.getZ(i),x=geo.attributes.position.getX(i);
    const dorsal=THREE.MathUtils.smoothstep(y,-.035,.065);
    const c=new THREE.Color().setRGB(1-dorsal*.76,1-dorsal*.62,.86-dorsal*.55);
    if(z<-.16&&z>-.24&&y>.005&&y<.048&&Math.abs(x)>.035)c.setRGB(.035,.045,.04);
    tint.set([c.r,c.g,c.b],i*3);
  }
  geo.setAttribute('color',new THREE.BufferAttribute(tint,3));mat.vertexColors=true;
  const count=96,mesh=new THREE.InstancedMesh(geo,mat,count);mesh.name='LAKE_FISH_SCHOOLS';mesh.frustumCulled=false;scene.add(mesh);
  const fish=[],dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){const school=i%3,cx=[-.5,5,-8][school],cz=[-5,-9,-10][school];fish.push({school,p:new THREE.Vector3(cx+(rand()-.5)*3,-.22-rand()*.15,cz+(rand()-.5)*2),v:new THREE.Vector3((rand()-.5)*.5,0,(rand()-.5)*.5),scale:.55+rand()*.55,phase:rand()*6.28});mesh.setColorAt(i,new THREE.Color().setRGB(.5+rand()*.4,.65+rand()*.3,.5+rand()*.2));}
  function update(dt){
    if(!state.paused){time.value+=dt;const t=time.value,next=[];
      for(let i=0;i<count;i++){
        const f=fish[i],force=new THREE.Vector3(),center=new THREE.Vector3(),align=new THREE.Vector3();let neighbors=0;
        for(let j=0;j<count;j++){if(i===j)continue;const other=fish[j],d=f.p.distanceToSquared(other.p);if(d<.18)force.addScaledVector(f.p.clone().sub(other.p),.15/Math.max(.01,d));if(f.school===other.school&&d<5){center.add(other.p);align.add(other.v);neighbors++;}}
        if(neighbors){force.addScaledVector(center.multiplyScalar(1/neighbors).sub(f.p),.14);force.addScaledVector(align.multiplyScalar(1/neighbors).sub(f.v),.35);}
        const target=new THREE.Vector3([-.5,5,-8][f.school]+Math.sin(t*.13+f.school)*1.7,0,[-5,-9,-10][f.school]+Math.cos(t*.17+f.school)*1.3);
        target.y=f.p.y;force.addScaledVector(target.sub(f.p),.18);
        for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]])if(groundHeight(f.p.x+dx,f.p.z+dz)>-.43)force.add(new THREE.Vector3(-dx*4,0,-dz*4));
        const away=f.p.clone().sub(walker.actor.position);away.y=0;if(away.length()<2.7)force.addScaledVector(away.normalize(),1.4);
        const v=f.v.clone().addScaledVector(force,dt);v.y=0;if(v.length()>.85)v.setLength(.85);next.push(v);
      }
      fish.forEach((f,i)=>{f.v.copy(next[i]);const candidate=f.p.clone().addScaledVector(f.v,dt);if(groundHeight(candidate.x,candidate.z)<-.42)f.p.copy(candidate);else f.v.multiplyScalar(-1);f.p.y=Math.max(groundHeight(f.p.x,f.p.z)+.12,-.25+Math.sin(t*.7+f.phase)*.06);});
    }
    fish.forEach((f,i)=>{dummy.position.copy(f.p);dummy.rotation.set(0,Math.atan2(-f.v.x,-f.v.z),0);dummy.scale.setScalar(f.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.instanceMatrix.needsUpdate=true;
  }
  // Nearshore water reveals submerged geometry; distant water retains its reflections.
  water.material.transparent=true;water.material.depthWrite=false;water.renderOrder=2;
  water.material.fragmentShader=water.material.fragmentShader.replace('vec4( outgoingLight, alpha )','vec4( outgoingLight, mix(.54,.99,smoothstep(3.,28.,distance)) )');
  const fishView=document.querySelector('#fish-view');if(fishView)fishView.onclick=()=>{walker.enable(false);camera.fov=47;camera.updateProjectionMatrix();camera.position.set(-.5,7,2.5);controls.target.set(-.5,-.3,-5);controls.minPolarAngle=.1;controls.minDistance=2;controls.update();};
  update(0);return {update,count,mesh};
}
