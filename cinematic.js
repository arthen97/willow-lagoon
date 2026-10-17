import * as THREE from 'three';
import {SUN_DIRECTION,SUN_COLOR,atmosphereTime} from './lighting-profile.js?v=20261017-stars-scale';
export function createCinematic({scene,camera,state,key,dawnLight,renderer,controls}){
 // Native cubemap background uses a full 360 × 180 degree panorama at infinity.
 // Keep the original overcast panorama at its natural angular scale.
 const source=scene.background;
 const skyMap=new THREE.WebGLCubeRenderTarget(1024,{type:THREE.HalfFloatType});
 skyMap.fromEquirectangularTexture(renderer,source);
 scene.userData.skyMap=skyMap;scene.background=skyMap.texture;
 scene.backgroundBlurriness=0;scene.backgroundIntensity=.48;
 scene.backgroundRotation.set(0,.6,0);scene.environmentRotation.copy(scene.backgroundRotation);
 // The existing PMREM was made directly from this same HDRI; retain its original radiance.
 key.color.setHex(SUN_COLOR);key.position.copy(SUN_DIRECTION).multiplyScalar(90);key.target.position.set(0,0,0);
 Object.assign(key.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:.5,far:190});key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.00012;key.shadow.normalBias=.035;key.shadow.camera.updateProjectionMatrix();
 dawnLight.color.set(0x90b8cf);dawnLight.intensity=.06;
 scene.fog=new THREE.Fog(0x829ca6,110,2300);
 const center=new THREE.Vector3();let storm=0;
 return {update(dt){
  atmosphereTime.value=state.time;storm=THREE.MathUtils.damp(storm,state.storm||0,.7,dt);scene.backgroundIntensity=.48*(1-storm*.48);
  key.intensity=state.compare?0:state.key*(1-storm*.52);scene.environmentIntensity=(state.compare?.9:.72)*(1-storm*.28);
  scene.fog.near=110-storm*75;scene.fog.far=2300-storm*1350;
  // Shadow coverage follows travel, snapped to texels to avoid crawling shadow edges.
  center.copy(controls.target);center.y=0;const texel=96/2048;center.x=Math.round(center.x/texel)*texel;center.z=Math.round(center.z/texel)*texel;
  key.target.position.copy(center);key.position.copy(center).addScaledVector(SUN_DIRECTION,90);
 }};
}
