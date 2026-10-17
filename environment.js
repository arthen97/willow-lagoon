import * as THREE from 'three';
import {createUnderstory} from './understory.js';
import {closeTerrainBoundary} from './terrain-seams.js';

export async function enrichEnvironment(ctx) {
  const {scene,model,rand,gauss,groundHeight,windMaterial,noiseGLSL,renderer}=ctx;
  const ground=model.getObjectByName('GROUND');
  const textures=new THREE.TextureLoader();
  const [color,normal,rough,boatRough]=await Promise.all([
    textures.loadAsync('./assets/stylized/ground-understory.jpg'),
    textures.loadAsync('./assets/ground-normal.jpg'),
    textures.loadAsync('./assets/ground-rough.jpg'),
    textures.loadAsync('./assets/boat-rough.jpg')
  ]);
  const old=ground.material;
  for(const texture of [normal,rough,boatRough]) texture.colorSpace=THREE.NoColorSpace;
  for(const texture of [color,normal,rough,boatRough]) {
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
    texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
  }
  color.colorSpace=THREE.SRGBColorSpace;
  for(const texture of [color,normal,rough]) {
    const source=texture===normal?(old.normalMap||old.map):old.map;
    // Terrain UVs span 44 × 32 metres: each quiet painted tile covers seven metres.
    texture.repeat.set(44/7,32/7);
    texture.offset.copy(source.offset);texture.flipY=source.flipY;
  }
  boatRough.flipY=old.map.flipY;
  const soil=new THREE.MeshPhysicalMaterial({map:color,normalMap:normal,roughnessMap:rough,
    color:new THREE.Color(.96,.98,.97),roughness:.9,metalness:0,normalScale:new THREE.Vector2(.12,.12),
    envMapIntensity:1.0,clearcoat:.18,clearcoatRoughness:.32});
  soil.onBeforeCompile=s=>{
    s.vertexShader='varying vec3 vSoil;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSoil=position;');
    s.fragmentShader='varying vec3 vSoil;\n'+noiseGLSL+'\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',
      '#include <map_fragment>\nfloat soilPatch=fbm(vSoil.xz*.055); float wet=1.-smoothstep(.01,.23,vSoil.y); diffuseColor.rgb*=mix(vec3(.91,.96,.90),vec3(1.04,1.02,.98),smoothstep(.30,.72,soilPatch)); diffuseColor.rgb*=1.-wet*.20;');
    s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',
      '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor*.65+.25,.53,.92); roughnessFactor=mix(roughnessFactor,.25,wet*.80);');
  };
  soil.customProgramCacheKey=()=> 'soil-understory-wet-edge-v8';
  ground.material=soil;closeTerrainBoundary(ground);
  model.traverse(o=>{
    if(!o.isMesh)return;
    if(o.material.name==='BOAT'){
      boatRough.flipY=o.material.map.flipY;
      o.material.roughnessMap=boatRough;o.material.roughness=.94;o.material.envMapIntensity=.45;
    }
  });

  // Mountain silhouettes now come from imported CC0 cliff scans in field-world.
  const treeSites=[[-9.4,-.7,4.9],[-13.5,.8,5.6],[-18,4,6.5],[7.9,-.8,5.4],[11.4,-1.8,4.2],[13.3,3.8,5.8],[8.8,7.3,4.1],[-27,8,5.6],[-34,22,6],[26,12,5],[37,28,6.4],[-22,38,5.8],[8,44,6.2],[30,59,6.1],[-38,63,5.9],[-43,40,5.2],[-46,46,6.1],[-40,49,4.8],[-32,57,5.5],[-29,64,6.7],[-20,66,5.3],[-13,70,6.1],[1,65,5.2],[8,70,6.7],[21,63,5.7],[28,69,6.4],[39,54,5.8],[44,61,6.5],[45,37,5.1]];
  const obstacles=[{x:-4.85,z:-.65,r:.48}];
  const grove=await ctx.loader.loadAsync('./assets/willow-grove-stream.glb');
  const originalMaterials=new Map();model.traverse(o=>{if(o.isMesh)originalMaterials.set(o.material.name,o.material);});
  grove.scene.updateMatrixWorld(true);const parts=[];
  grove.scene.traverse(o=>{
    if(!o.isMesh)return;
    const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(4.85,-.25108489,.65);
    const material=(originalMaterials.get(o.material.name)||o.material).clone();
    material.roughness=.9;material.envMapIntensity=.35;windMaterial(material);
    parts.push({geometry,material,name:o.name});
  });
  treeSites.forEach(([x,z,h],i)=>{
    const group=new THREE.Group(),scale=h/6.2;group.name='SHORE_WILLOW_'+i;
    group.position.set(x,groundHeight(x,z),z);group.scale.set(scale*(.82+rand()*.25),scale,scale*(.8+rand()*.3));group.rotation.y=i*2.29+.6;
    for(const part of parts){const mesh=new THREE.Mesh(part.geometry,part.material);mesh.castShadow=z<48;mesh.receiveShadow=true;group.add(mesh);}
    scene.add(group);obstacles.push({x,z,r:.25});
  });

  const ecology=await createUnderstory({...ctx,obstacles});
  return {ground,obstacles,stats:{trees:treeSites.length+1,grassBlades:ecology.grassCount,grassVariants:ecology.variants,shrubs:ecology.shrubCount}};
}
