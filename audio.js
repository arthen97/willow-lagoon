// Separate ElevenLabs stems, locally mastered with a three-second loop seam.
export function createAmbientSound(){
 let context=null,enabled=false,ducked=false,loading=null,disposed=false;
 const layers=new Map();let caveMix=0;
 async function load(){
  if(loading)return loading;
  loading=Promise.allSettled(['score','exterior','cave'].map(async name=>{
   const response=await fetch(`./assets/audio/${name}.mp3`);if(!response.ok)throw new Error('Audio unavailable');
   const buffer=await context.decodeAudioData(await response.arrayBuffer());if(disposed)return;
   const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(context.destination);source.start();layers.set(name,{source,gain});mix();
  }));return loading;
 }
 function mix(){if(!context||disposed)return;const v=enabled?(ducked?.28:1):0;const levels={score:.34,exterior:.67*(1-caveMix),cave:.72*caveMix};for(const [name,layer]of layers)layer.gain.gain.setTargetAtTime(levels[name]*v,context.currentTime,.7);}
 return {
  get enabled(){return enabled;},
  setDucked(value){ducked=!!value;mix();},
  update(position){if(!position)return;const x=Math.abs(position.x+18),z=position.z;const inside=Math.max(0,Math.min(1,(z-33.5)/3,(52.5-z)/2,(4.6-x)/1.1));if(Math.abs(inside-caveMix)>.01){caveMix=inside;mix();}},
  async toggle(){if(disposed)return false;enabled=!enabled;if(enabled){const AC=window.AudioContext||window.webkitAudioContext;if(!AC){enabled=false;return false;}context??=new AC();await context.resume();await load();if(!layers.size)enabled=false;}mix();return enabled;},
  dispose(){disposed=true;enabled=false;for(const {source}of layers.values())source.stop();layers.clear();if(context&&context.state!=='closed')void context.close();}
 };
}
