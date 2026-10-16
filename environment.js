import * as THREE from 'three';

export async function enrichEnvironment(ctx) {
  const {scene,model,rand,gauss,groundHeight,windMaterial,noiseGLSL,renderer}=ctx;
  const ground=model.getObjectByName('GROUND');
  const textures=new THREE.TextureLoader();
  const [color,normal,rough,boatRough]=await Promise.all([
    textures.loadAsync('./assets/ground-color.jpg'),
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
    // Terrain UVs span 44 × 32 metres: each 4K tile now covers two metres.
    texture.repeat.set(22,16);
    texture.offset.copy(source.offset);texture.flipY=source.flipY;
  }
  boatRough.flipY=old.map.flipY;
  const soil=new THREE.MeshPhysicalMaterial({map:color,normalMap:normal,roughnessMap:rough,
    color:new THREE.Color(.91,.88,.81),roughness:.96,metalness:0,normalScale:new THREE.Vector2(.42,.42),
    envMapIntensity:.4,clearcoat:.035,clearcoatRoughness:.65});
  soil.onBeforeCompile=s=>{
    s.vertexShader='varying vec3 vSoil;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSoil=position;');
    s.fragmentShader='varying vec3 vSoil;\n'+noiseGLSL+'\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',
      '#include <map_fragment>\nfloat soilPatch=fbm(vSoil.xz*.65); float wet=1.-smoothstep(.01,.23,vSoil.y); diffuseColor.rgb*=mix(vec3(.82,.88,.74),vec3(1.06,1.00,.91),smoothstep(.30,.72,soilPatch)); diffuseColor.rgb*=1.-wet*.20;');
    s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',
      '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor*.7+.27,.57,.98); roughnessFactor=mix(roughnessFactor,.42,wet*.55);');
  };
  soil.customProgramCacheKey=()=> 'soil-natural-detail-v6';
  ground.material=soil;
  model.traverse(o=>{
    if(!o.isMesh)return;
    if(o.material.name==='BOAT'){
      boatRough.flipY=o.material.map.flipY;
      o.material.roughnessMap=boatRough;o.material.roughness=.94;o.material.envMapIntensity=.45;
    }
  });

  // Mountain silhouettes now come from imported CC0 cliff scans in field-world.
  const treeSites=[[-9.4,-.7,4.9],[-13.5,.8,5.6],[-18,4,6.5],[7.9,-.8,5.4],[11.4,-1.8,4.2],[13.3,3.8,5.8],[8.8,7.3,4.1],[-27,8,5.6],[-34,22,6],[26,12,5],[37,28,6.4],[-22,38,5.8],[8,44,6.2],[30,59,6.1],[-38,63,5.9]];
  const obstacles=[{x:-4.85,z:-.65,r:.48}],dummy=new THREE.Object3D();
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
    for(const part of parts){const mesh=new THREE.Mesh(part.geometry,part.material);mesh.castShadow=i<2||i===3;mesh.receiveShadow=true;group.add(mesh);}
    scene.add(group);obstacles.push({x,z,r:.25});
  });

  // A patchy meadow: short grass, long sedges, and clearings around the trail and wreck.
  const meadowAsset=(await ctx.loader.loadAsync('./assets/grass/grass.gltf')).scene;
  meadowAsset.updateMatrixWorld(true);let grassSource;meadowAsset.traverse(o=>{if(o.isMesh&&!grassSource)grassSource=o;});
  const blade=grassSource.geometry.clone().applyMatrix4(grassSource.matrixWorld);blade.computeBoundingBox();const bounds=blade.boundingBox,center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());blade.translate(-center.x,-bounds.min.y,-center.z);blade.scale(.35/size.y,.35/size.y,.35/size.y);
  const grassMat=windMaterial(grassSource.material.clone(),'grass');grassMat.color.setHex(0xc4cfb2);grassMat.roughness=.94;grassMat.envMapIntensity=.35;grassMat.side=THREE.DoubleSide;
  const list=[];
  for(let k=0;k<2600;k++){
    const near=k<1300,x=near?-20+rand()*35:-56+rand()*112,z=near?-2.8+rand()*16:-14+rand()*90,h=groundHeight(x,z);
    const patch=ctx.valueNoise(x*.55,4,z*.55),trail=Math.abs(x-(-1.5+.47*(z-3)));
    if((Math.abs(x+18)<6&&z>33&&z<53)||Math.hypot(x+2.5,z-6.5)<3.5||h<.035||Math.hypot(x-4,z-.2)<1.8||Math.hypot(x+2.35,z-2.8)<.42)continue;
    if(trail<.65&&rand()<.94)continue;
    if(rand()>THREE.MathUtils.smoothstep(patch,.26,.68)*.85+.15)continue;
    const size=.36+rand()*.8,amount=near?2+Math.floor(rand()*3):1+Math.floor(rand()*2);
    for(let j=0;j<amount;j++){
      const bx=x+gauss()*.10,bz=z+gauss()*.10,by=groundHeight(bx,bz);
      if(by>.02)list.push([bx,by-.008,bz,size*(.65+rand()*.5),rand()*Math.PI*2,rand()]);
    }
  }
  // Spatial batches let the renderer cull vegetation behind the camera.
  const patches=new Map();
  for(const entry of list){const key=Math.floor(entry[0]/12)+','+Math.floor(entry[2]/12);if(!patches.has(key))patches.set(key,[]);patches.get(key).push(entry);}
  for(const [key,entries] of patches){
    const meadow=new THREE.InstancedMesh(blade,grassMat,entries.length);
    entries.forEach(([x,y,z,s,a,c],i)=>{
      dummy.position.set(x,y,z);dummy.rotation.set((rand()-.5)*.48,a,(rand()-.5)*.35);dummy.scale.set(.7+rand()*.8,s,s);dummy.updateMatrix();meadow.setMatrixAt(i,dummy.matrix);
      meadow.setColorAt(i,new THREE.Color().setRGB(.78+c*.18,.82+c*.18,.70+c*.17));
    });
    meadow.name='CLUSTERED_MEADOW_'+key;meadow.receiveShadow=true;meadow.computeBoundingSphere();scene.add(meadow);
  }
  return {ground,obstacles,stats:{trees:treeSites.length+1,grassBlades:list.length,mountainLayers:8}};
}
