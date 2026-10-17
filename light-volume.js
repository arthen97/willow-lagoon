import * as THREE from 'three';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {SUN_DIRECTION,atmosphereTime,cloudGLSL} from './lighting-profile.js?v=20261017-stars-scale';
export function createLightVolume(){
 const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:false});
 const uniforms={tDepth:{value:null},sunShadow:{value:null},sunMatrix:{value:new THREE.Matrix4()},cameraWorld:{value:new THREE.Matrix4()},inverseProjection:{value:new THREE.Matrix4()},sunDirection:{value:SUN_DIRECTION},sunRadiance:{value:new THREE.Color()},uCloudTime:{value:0},volumeStrength:{value:.6},volumeSteps:{value:matchMedia('(pointer: coarse)').matches?10:16},cameraNear:{value:.08},cameraFar:{value:6500}};
 const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
 #include <packing>
 uniform sampler2D tDepth;uniform float cameraNear,cameraFar;varying vec2 vUv;
   uniform sampler2D sunShadow;uniform mat4 sunMatrix,cameraWorld,inverseProjection;
   uniform vec3 sunDirection,sunRadiance;uniform float uCloudTime,volumeStrength;uniform int volumeSteps;
   ${cloudGLSL}
   float sunVisibility(vec3 p){vec4 q=sunMatrix*vec4(p,1.);q.xyz/=q.w;
    if(q.x<0.||q.x>1.||q.y<0.||q.y>1.||q.z<0.||q.z>1.)return 0.;
    return step(q.z-.0005,unpackRGBAToDepth(texture2D(sunShadow,q.xy)));
   }
   vec3 scatterAir(vec2 uv,float depth){
    if(volumeStrength<.001)return vec3(0.);
    vec4 v=inverseProjection*vec4(uv*2.-1.,depth*2.-1.,1.);v/=v.w;
    vec3 origin=cameraWorld[3].xyz,end=(cameraWorld*v).xyz,ray=end-origin;
    float travel=min(length(ray),115.);ray=normalize(ray);
    float stepSize=travel/float(volumeSteps),jitter=fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))*52.9829189);
    float sum=0.,transmittance=1.;
    for(int i=0;i<16;i++){if(i>=volumeSteps)break;
     vec3 p=origin+ray*(float(i)+jitter)*stepSize;
     float density=.009*exp(-max(p.y,0.)*.085);
     float extinction=exp(-density*stepSize);
     float lit=sunVisibility(p)*cloudTransmission(p,sunDirection,uCloudTime);
     sum+=transmittance*(1.-extinction)*lit;transmittance*=extinction;
    }
    float alignment=max(dot(ray,sunDirection),0.);
    float phase=.12+.88*pow(alignment,6.);
    return sunRadiance*sum*phase*volumeStrength;
   }

 void main(){float depth=texture2D(tDepth,vUv).x;float distance=-perspectiveDepthToViewZ(depth,cameraNear,cameraFar);gl_FragColor=vec4(scatterAir(vUv,depth),distance);}
 `});
 const quad=new FullScreenQuad(material);
 return {target,render(renderer,readBuffer,camera,key,state){
  const width=Math.max(1,Math.ceil(readBuffer.width/3)),height=Math.max(1,Math.ceil(readBuffer.height/3));
  if(target.width!==width||target.height!==height)target.setSize(width,height);
  uniforms.tDepth.value=readBuffer.depthTexture;uniforms.sunShadow.value=key.shadow.map?.texture||readBuffer.texture;uniforms.sunMatrix.value.copy(key.shadow.matrix);
  uniforms.cameraWorld.value.copy(camera.matrixWorld);uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);
  uniforms.sunRadiance.value.copy(key.color).multiplyScalar(key.intensity);uniforms.uCloudTime.value=atmosphereTime.value;
  uniforms.volumeStrength.value=state.compare||!key.shadow.map?0:.6;uniforms.cameraNear.value=camera.near;uniforms.cameraFar.value=camera.far;
  renderer.setRenderTarget(target);quad.render(renderer);
 },dispose(){quad.dispose();material.dispose();target.dispose();}};
}
