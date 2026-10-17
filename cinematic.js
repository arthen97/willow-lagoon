import * as THREE from 'three';
import {SUN_DIRECTION,SUN_COLOR,atmosphereTime,cloudGLSL} from './lighting-profile.js';
export function createCinematic({scene,camera,state,key,dawnLight,renderer,controls}){
 const uniforms={uTime:atmosphereTime,uStorm:{value:0},uEnvironment:{value:scene.background},uSun:{value:SUN_DIRECTION}};
 const sky=new THREE.Mesh(new THREE.SphereGeometry(4200,36,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms,vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
 varying vec3 vDir;uniform float uTime,uStorm;uniform vec3 uSun;uniform sampler2D uEnvironment;${cloudGLSL}
 void main(){
  vec3 d=normalize(vDir);float h=max(d.y,0.),alignment=max(dot(d,uSun),0.);
  vec3 color=mix(vec3(.36,.48,.51),vec3(.065,.17,.28),pow(h,.48));
  color+=vec3(.40,.30,.16)*pow(alignment,12.)*.32;
  vec2 p=d.xz/max(.13,d.y+.13)*2.0+vec2(uTime*.003,0.);
  float clouds=cloudField(p),cover=smoothstep(.43,.68,clouds);
  vec3 cloudColor=mix(vec3(.25,.34,.38),vec3(.78,.76,.63),pow(alignment,3.));
  color=mix(color,cloudColor,cover*.78);
  float disc=smoothstep(.99955,.99982,alignment)*(1.-cover*.85);
  color+=vec3(1.0,.84,.56)*(disc*5.0+pow(alignment,150.)*.42);
  vec2 envUv=vec2(atan(d.z,d.x)*.15915494+.5,asin(clamp(d.y,0.,1.))*.31830989+.5);
  color=mix(color,min(texture2D(uEnvironment,envUv).rgb,vec3(1.3))*.48,.08);
  color=mix(color,vec3(.075,.095,.065),(1.-smoothstep(-.2,0.,d.y)));
  color=mix(color,color*vec3(.43,.58,.68),uStorm*.66);
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`}));
 sky.name='PAINTED_SUN_AND_CLOUDS';sky.renderOrder=-10;sky.frustumCulled=false;scene.add(sky);scene.background=null;
 // Bake this same sky into PBR reflections; the existing HDRI retains subtle natural variation.
 const envScene=new THREE.Scene();envScene.add(sky.clone());
 const pmrem=new THREE.PMREMGenerator(renderer),map=pmrem.fromScene(envScene,.025,.1,6500);
 scene.userData.environmentMap?.dispose();scene.userData.environmentMap=map;scene.environment=map.texture;scene.environmentRotation.set(0,0,0);pmrem.dispose();
 key.color.setHex(SUN_COLOR);key.position.copy(SUN_DIRECTION).multiplyScalar(90);key.target.position.set(0,0,0);
 Object.assign(key.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:.5,far:190});key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.00012;key.shadow.normalBias=.035;key.shadow.camera.updateProjectionMatrix();
 dawnLight.color.set(0x90b8cf);dawnLight.intensity=.06;
 scene.fog=new THREE.Fog(0x829ca6,110,2300);
 const center=new THREE.Vector3();let storm=0;
 return {update(dt){
  atmosphereTime.value=state.time;storm=THREE.MathUtils.damp(storm,state.storm||0,.7,dt);uniforms.uStorm.value=storm;
  key.intensity=state.compare?0:state.key*(1-storm*.52);scene.environmentIntensity=(state.compare?.9:.72)*(1-storm*.28);
  scene.fog.near=110-storm*75;scene.fog.far=2300-storm*1350;sky.position.copy(camera.position);
  // Shadow coverage follows travel, snapped to texels to avoid crawling shadow edges.
  center.copy(controls.target);center.y=0;const texel=96/2048;center.x=Math.round(center.x/texel)*texel;center.z=Math.round(center.z/texel)*texel;
  key.target.position.copy(center);key.position.copy(center).addScaledVector(SUN_DIRECTION,90);
 }};
}
