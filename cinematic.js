import * as THREE from 'three';
import {SUN_DIRECTION,SUN_COLOR,atmosphereTime,cloudGLSL} from './lighting-profile.js?v=20261017-stars-scale';
export function createCinematic({scene,camera,state,key,dawnLight,renderer,controls}){
 const uniforms={uTime:atmosphereTime,uStorm:{value:0},uEnvironment:{value:scene.background},uSun:{value:SUN_DIRECTION}};
 const sky=new THREE.Mesh(new THREE.SphereGeometry(4200,36,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms,vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
 varying vec3 vDir;uniform float uTime,uStorm;uniform vec3 uSun;uniform sampler2D uEnvironment;${cloudGLSL}
 void main(){
  vec3 d=normalize(vDir);float h=max(d.y,0.),alignment=max(dot(d,uSun),0.);
  // The CC0 4K EXR supplies the stars and Milky Way, without synthetic star dots.
  vec2 envUv=vec2(atan(d.z,d.x)*.15915494+.5,asin(clamp(d.y,-1.,1.))*.31830989+.5);
  vec3 color=texture2D(uEnvironment,envUv).rgb*1.5;
  float horizon=pow(1.-h,4.);
  color+=vec3(.012,.022,.032)*horizon;
  vec2 p=d.xz/max(.13,d.y+.13)*2.0+vec2(uTime*.003,0.);
  float cover=smoothstep(.48,.74,cloudField(p))*(.12+uStorm*.65);
  color=mix(color,vec3(.018,.028,.039),cover);
  float disc=smoothstep(.99977,.99989,alignment)*(1.-cover);
  color+=vec3(.72,.82,1.)*(disc*1.8+pow(alignment,180.)*.028);
  color=mix(vec3(.008,.012,.016),color,smoothstep(-.18,.015,d.y));
  color*=1.-uStorm*.42;
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`}));
 sky.name='STARRY_HDRI_AND_MOON';sky.renderOrder=-10;sky.frustumCulled=false;scene.add(sky);scene.background=null;
 // Bake the same starfield and moon into PBR reflections; visible sky and reflections agree.
 const envScene=new THREE.Scene();envScene.add(sky.clone());
 const pmrem=new THREE.PMREMGenerator(renderer),map=pmrem.fromScene(envScene,.025,.1,6500);
 scene.userData.environmentMap?.dispose();scene.userData.environmentMap=map;scene.environment=map.texture;scene.environmentRotation.set(0,0,0);pmrem.dispose();
 key.color.setHex(SUN_COLOR);key.position.copy(SUN_DIRECTION).multiplyScalar(90);key.target.position.set(0,0,0);
 Object.assign(key.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:.5,far:190});key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.00012;key.shadow.normalBias=.035;key.shadow.camera.updateProjectionMatrix();
 dawnLight.color.set(0x90b8cf);dawnLight.intensity=.06;
 scene.fog=new THREE.Fog(0x22333e,110,2300);
 const center=new THREE.Vector3();let storm=0;
 return {update(dt){
  atmosphereTime.value=state.time;storm=THREE.MathUtils.damp(storm,state.storm||0,.7,dt);uniforms.uStorm.value=storm;
  key.intensity=state.compare?0:state.key*(1-storm*.52);scene.environmentIntensity=(state.compare?.9:.8)*(1-storm*.28);
  scene.fog.near=110-storm*75;scene.fog.far=2300-storm*1350;sky.position.copy(camera.position);
  // Shadow coverage follows travel, snapped to texels to avoid crawling shadow edges.
  center.copy(controls.target);center.y=0;const texel=96/2048;center.x=Math.round(center.x/texel)*texel;center.z=Math.round(center.z/texel)*texel;
  key.target.position.copy(center);key.position.copy(center).addScaledVector(SUN_DIRECTION,90);
 }};
}
