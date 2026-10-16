import * as THREE from 'three';
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
   material.roughness=.94;material.metalness=Math.min(material.metalness,.06);
   material.roughnessMap=null;material.metalnessMap=null;material.envMapIntensity=.18;
   if('clearcoat'in material)material.clearcoat=0;
   material.normalScale?.multiplyScalar(.16);material.aoMapIntensity=Math.min(material.aoMapIntensity??1,.40);
   material.onBeforeCompile=function(shader,renderer){
    baseCompile.call(this,shader,renderer);
    // Sample coarser colour detail before painting broad tonal areas; alpha edges stay crisp.
    const mapChunk=THREE.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )',`texture2D( map, vMapUv, ${foliage?'0.0':'2.0'} )`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',mapChunk+`
     float paintLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
     float paintValue=mix(paintLuma,(floor(paintLuma*7.0)+.5)/7.0,.52);
     diffuseColor.rgb*=clamp(paintValue/max(paintLuma,.035),.78,1.22);
     diffuseColor.rgb=mix(vec3(paintValue),diffuseColor.rgb,1.08);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
     vec3 inkDiffuse=reflectedLight.directDiffuse+reflectedLight.indirectDiffuse;
     float inkIllum=dot(inkDiffuse,vec3(.2126,.7152,.0722))/max(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)),.025);
     float inkBands=.34+.24*smoothstep(.17,.25,inkIllum)+.28*smoothstep(.47,.57,inkIllum)+.27*smoothstep(.88,1.02,inkIllum);
     vec3 inkShadow=mix(vec3(.76,.86,1.0),vec3(1.0),smoothstep(.2,.75,inkIllum));
     outgoingLight=max(vec3(0.),diffuseColor.rgb)*inkBands*inkShadow+totalEmissiveRadiance;
     #include <opaque_fragment>
    `);
   };
   material.customProgramCacheKey=()=>baseKey+'|painted-cel-v1|'+foliage;
   material.needsUpdate=true;
  }
 });
 return seen.size;
}

// Read the actual scene depth, including animated/skinned meshes and alpha-tested leaves.
// No duplicate geometry or override materials that could alter silhouettes or physics.
export function addInkPass(composer,camera){
 for(const target of[composer.renderTarget1,composer.renderTarget2]){
  target.depthBuffer=true;
  target.depthTexture=new THREE.DepthTexture(target.width,target.height,THREE.UnsignedIntType);
  target.depthTexture.minFilter=target.depthTexture.magFilter=THREE.NearestFilter;
 }
 class InkPass extends ShaderPass{
  constructor(){super({name:'HandDrawnContour',uniforms:{tDiffuse:{value:null},tDepth:{value:null},resolution:{value:new THREE.Vector2(1,1)},cameraNear:{value:camera.near},cameraFar:{value:camera.far},stroke:{value:1.15},inkStrength:{value:.8}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`
   #include <packing>
   uniform sampler2D tDiffuse;uniform sampler2D tDepth;
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
    gl_FragColor=vec4(mix(color.rgb,ink,opacity),color.a);
   }`});this.material.depthTest=false;this.material.depthWrite=false;}
  render(renderer,writeBuffer,readBuffer,dt,mask){
   this.uniforms.tDepth.value=readBuffer.depthTexture;
   this.uniforms.resolution.value.set(readBuffer.width,readBuffer.height);
   this.uniforms.cameraNear.value=camera.near;this.uniforms.cameraFar.value=camera.far;
   super.render(renderer,writeBuffer,readBuffer,dt,mask);
  }
 }
 const ink=new InkPass();composer.addPass(ink);return ink;
}
