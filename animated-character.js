import * as THREE from 'three';
// Meshy rig and motion clips share one skeleton; no geometric guesses for weights.
export function createAnimatedCharacter(asset,actor){
 const root=new THREE.Group();root.name='RIGGED_CHARACTER';actor.add(root);const model=asset.scene;model.rotation.y=Math.PI;root.add(model);model.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(model),height=box.max.y-box.min.y,scale=1.82/height;model.scale.multiplyScalar(scale);model.position.y=-box.min.y*scale;
 let body,hips;model.traverse(o=>{if(o.isSkinnedMesh){body=o;o.frustumCulled=false;o.castShadow=o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){m.roughness=Math.max(m.roughness,.72);m.envMapIntensity=.45;}}if(o.name==='Hips')hips=o;});
 const clips=asset.animations.map(a=>a.clone()),mixer=new THREE.AnimationMixer(model);
 for(const c of clips){const track=c.tracks.find(t=>t.name==='Hips.position');if(track){const v=track.values;const baseX=v[0],baseZ=v[2];for(let i=0;i<v.length;i+=3){v[i]-=baseX;v[i+2]=hips.position.z;}}}
 const actions={idle:mixer.clipAction(clips.find(c=>c.name==='Idle')),walk:mixer.clipAction(clips.find(c=>c.name==='Casual_Walk')),run:mixer.clipAction(clips.find(c=>c.name==='Run_02')),jump:mixer.clipAction(clips.find(c=>c.name==='Regular_Jump'))};
 for(const [id,a]of Object.entries(actions)){a.play();a.setEffectiveWeight(id==='idle'?1:0);if(id==='jump'){a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.paused=true;}}
 let idleWeight=1,walkWeight=0,runWeight=0,jumpWeight=0,lastStage='ground';
 const jumpDuration=actions.jump.getClip().duration;
 return {body,root,mixer,actions,mount(object,boneName){actor.updateMatrixWorld(true);model.getObjectByName(boneName)?.attach(object);},update(dt,{speed,jumpStage,jumpPhase,landing}){
  const jumping=jumpStage!=='ground';const moving=THREE.MathUtils.smoothstep(speed,.06,.45),run=THREE.MathUtils.smoothstep(speed,1.7,3.1);
  idleWeight=THREE.MathUtils.damp(idleWeight,jumping?0:1-moving,12,dt);walkWeight=THREE.MathUtils.damp(walkWeight,jumping?0:moving*(1-run),12,dt);runWeight=THREE.MathUtils.damp(runWeight,jumping?0:moving*run,12,dt);jumpWeight=THREE.MathUtils.damp(jumpWeight,jumping?1:0,22,dt);
  actions.idle.setEffectiveWeight(idleWeight);actions.walk.setEffectiveWeight(walkWeight);actions.run.setEffectiveWeight(runWeight);actions.jump.setEffectiveWeight(jumpWeight);
  actions.walk.setEffectiveTimeScale(THREE.MathUtils.clamp(speed/1.35,.65,1.45));actions.run.setEffectiveTimeScale(THREE.MathUtils.clamp(speed/3.5,.72,1.2));
  if(jumping){if(lastStage==='ground'){actions.jump.reset().play();actions.jump.paused=true;}let t=0;if(jumpStage==='anticipate')t=jumpPhase*.27;else if(jumpStage==='air')t=.27+jumpPhase*.36;else t=.63+jumpPhase*.37;actions.jump.time=t*jumpDuration;}
  mixer.update(dt);if(jumpStage==='air'&&hips)hips.position.y=98; // World-space gravity owns the flight arc, avoiding double vertical motion.
  root.rotation.x=THREE.MathUtils.damp(root.rotation.x,jumping?0:-run*.045,9,dt);lastStage=jumpStage;
 }};
}
