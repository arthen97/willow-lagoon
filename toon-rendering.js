import * as THREE from 'three';
import {SUN_DIRECTION,atmosphereTime,cloudGLSL} from './lighting-profile.js?v=20261017-stars-scale';
import {createLightVolume} from './light-volume.js?v=20261017-stars-scale';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

// Material-only treatment: preserve mesh geometry, bone skinning, wind hooks and animation.
export function stylizeMaterials(scene){
 const seen=new Set();
 scene.traverse(object=>{
  if(!object.isMesh)return;
  for(const material of(Array.isArray(object.material)?object.material:[object.material])){
   if(!material?.isMeshStandardMaterial||seen.has(material)||material.userData.inkPaint)continue;
   seen.add(material);material.userData.inkPaint=true;
   const foliage=material.alphaTest>0||/LEAF|MEADOW|GRASS/i.test(object.name+' '+material.name);
   const baseCompile=material.onBeforeCompile,baseKey=material.customProgramCacheKey();
   // Keep authored PBR maps and coatings: a tank, visor and wet soil must respond differently.
   if(foliage)material.roughness=Math.max(material.roughness,.82);
   material.envMapIntensity=Math.max(material.envMapIntensity??1,foliage?.55:1.0);
   material.normalScale?.multiplyScalar(foliage?.45:.85);
   material.aoMapIntensity=Math.min(material.aoMapIntensity??1,.75);
   material.onBeforeCompile=function(shader,renderer){
    baseCompile.call(this,shader,renderer);
    shader.uniforms.uCloudTime=atmosphereTime;shader.uniforms.uSunDirection={value:SUN_DIRECTION};
    shader.fragmentShader='uniform float uCloudTime;uniform vec3 uSunDirection;\n'+cloudGLSL+'\n'+shader.fragmentShader;
    // Three unrolls this light loop into one scope: never declare locals in the injected snippet.
    // Modulate directional light before the BRDF, including its specular response.
    const lights=THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );',`getDirectionalLightInfo( directionalLight, directLight );
     directLight.color*=cloudTransmission(vCloudWorld,uSunDirection,uCloudTime);`);
    shader.vertexShader='varying vec3 vCloudWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
      vec4 cloudPosition=vec4(transformed,1.);
      #ifdef USE_BATCHING
       cloudPosition=batchingMatrix*cloudPosition;
      #endif
      #ifdef USE_INSTANCING
       cloudPosition=instanceMatrix*cloudPosition;
      #endif
      vCloudWorld=(modelMatrix*cloudPosition).xyz;`);
    shader.fragmentShader='varying vec3 vCloudWorld;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',lights);
    // Sample coarser colour detail before painting broad tonal areas; alpha edges stay crisp.
    const mapChunk=THREE.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )',`texture2D( map, vMapUv, ${foliage?'0.0':'.65'} )`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',mapChunk+`
     float paintLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
     // Keep painted albedo continuous; cel bands belong to illumination, not texture pixels.
     diffuseColor.rgb=mix(vec3(paintLuma),diffuseColor.rgb,1.04);
    `);
    // Paint diffuse BEFORE transmission, specular, sheen and clearcoat are composed by Three.
    // Scaling the actual light keeps cast shadows and metallic energy conservation intact.
    const diffuseLine='vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;';
    shader.fragmentShader=shader.fragmentShader.replace(diffuseLine,diffuseLine+`
     float inkIllum=dot(totalDiffuse,vec3(.2126,.7152,.0722))/max(dot(material.diffuseColor,vec3(.2126,.7152,.0722)),.025);
     float inkBands=.08+.20*smoothstep(.14,.22,inkIllum)+.28*smoothstep(.40,.50,inkIllum)+.32*smoothstep(.72,.84,inkIllum)+.30*smoothstep(1.05,1.19,inkIllum);
     float inkRatio=mix(1.0,clamp(inkBands/max(inkIllum,.025),.72,1.22),.65);
     vec3 inkShadow=mix(vec3(.91,.96,1.0),vec3(1.0),smoothstep(.12,.65,inkIllum));
     totalDiffuse*=inkRatio*inkShadow;
    `);
   };
   material.customProgramCacheKey=()=>baseKey+'|painted-sun-pbr-v5|'+foliage;
   material.needsUpdate=true;
  }
 });
 return seen.size;
}

// Read the actual scene depth, including animated/skinned meshes and alpha-tested leaves.
// No duplicate geometry or override materials that could alter silhouettes or physics.
export function addInkPass(composer,camera,key,state){
 for(const target of[composer.renderTarget1,composer.renderTarget2]){
  target.depthBuffer=true;
  target.depthTexture=new THREE.DepthTexture(target.width,target.height,THREE.UnsignedIntType);
  target.depthTexture.minFilter=target.depthTexture.magFilter=THREE.NearestFilter;
 }
 class InkPass extends ShaderPass{
  constructor(){super({name:'HandDrawnContour',uniforms:{tDiffuse:{value:null},tDepth:{value:null},resolution:{value:new THREE.Vector2(1,1)},cameraNear:{value:camera.near},cameraFar:{value:camera.far},stroke:{value:1.15},inkStrength:{value:.68},tAir:{value:null},airSize:{value:new THREE.Vector2(1,1)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`
   #include <packing>
   uniform sampler2D tDiffuse;uniform sampler2D tDepth;
   uniform sampler2D tAir;uniform vec2 airSize;
   vec3 readAir(vec2 uv,float sceneDistance){
    vec2 pixel=uv*airSize-.5,base=floor(pixel),f=fract(pixel);vec3 sum=vec3(0.);float weights=0.;
    for(int y=0;y<2;y++)for(int x=0;x<2;x++){
     vec2 offset=vec2(float(x),float(y));vec2 sampleUv=(base+offset+.5)/airSize;
     vec4 sampleAir=texture2D(tAir,clamp(sampleUv,vec2(0.),vec2(1.)));
     float spatial=(x==0?1.-f.x:f.x)*(y==0?1.-f.y:f.y);
     float depthWeight=exp(-abs(sampleAir.a-sceneDistance)/max(.12,sceneDistance*.015));
     float weight=spatial*depthWeight;sum+=sampleAir.rgb*weight;weights+=weight;
    }
    return weights>.001?sum/weights:vec3(0.);
   }
   uniform vec2 resolution;uniform float cameraNear,cameraFar,stroke,inkStrength;varying vec2 vUv;
   float distanceAt(vec2 uv){float d=texture2D(tDepth,clamp(uv,vec2(.001),vec2(.999))).x;return -perspectiveDepthToViewZ(d,cameraNear,cameraFar);}
   void main(){
    vec4 color=texture2D(tDiffuse,vUv);vec2 px=stroke/resolution;
    float center=distanceAt(vUv),left=distanceAt(vUv-vec2(px.x,0.)),right=distanceAt(vUv+vec2(px.x,0.));
    float up=distanceAt(vUv+vec2(0.,px.y)),down=distanceAt(vUv-vec2(0.,px.y));
    float nearest=min(center,min(min(left,right),min(up,down)));
    float edge=max(max(abs(center-left),abs(center-right)),max(abs(center-up),abs(center-down)))/max(nearest,1.);
    float silhouette=smoothstep(.026,.095,edge);
    float distanceFade=1.-smoothstep(160.,1250.,nearest);
    float leafMask=smoothstep(.01,.08,color.g-max(color.r,color.b));
    float opacity=silhouette*mix(.70,.25,leafMask)*distanceFade*inkStrength;
    vec3 ink=vec3(.023,.034,.038);
    vec3 shafts=readAir(vUv,center);
    gl_FragColor=vec4(mix(color.rgb,ink,opacity)+shafts,color.a);
   }`});this.material.depthTest=false;this.material.depthWrite=false;this.volume=createLightVolume();}
  dispose(){this.volume.dispose();super.dispose();}
  render(renderer,writeBuffer,readBuffer,dt,mask){
   this.uniforms.tDepth.value=readBuffer.depthTexture;
   this.volume.render(renderer,readBuffer,camera,key,state);
   this.uniforms.tAir.value=this.volume.target.texture;
   this.uniforms.airSize.value.set(this.volume.target.width,this.volume.target.height);
   this.uniforms.resolution.value.set(readBuffer.width,readBuffer.height);
   this.uniforms.cameraNear.value=camera.near;this.uniforms.cameraFar.value=camera.far;
   super.render(renderer,writeBuffer,readBuffer,dt,mask);
  }
 }
 const ink=new InkPass();composer.addPass(ink);return ink;
}
