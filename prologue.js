const $=s=>document.querySelector(s);
export function createPrologue({enter}){
 const overlay=$('#prologue'),video=$('#prologue-video'),voice=$('#prologue-voice');
 let active=false,enterAfter=false,silent=false,closing=false,phase='video',brandFrame=0,brandTime=0,brandLast=0;
 const captions=[
  [0,'SpaceX 承诺给我一个靠窗座位。结果把整扇破窗都送给我了。','01 / 非计划着陆'],
  [5.1,'距离地球四十光年。我的氧气，正在一点点消失。','02 / 失联'],
  [10.2,'但这种蓝色凝胶，能捕获可供呼吸的氧气。','03 / 蓝息质'],
  [14.2,'收集它。把采集罐插回营地。然后接通地球。','04 / 一次回音'],
  [18.6,'看来，找客服之前，还得先自己发明呼吸。','EARTH, DO YOU COPY?']
 ];
 function cue(){const t=video.currentTime;const item=[...captions].reverse().find(x=>t>=x[0])||captions[0];$('#prologue-caption').textContent=item[1];$('#prologue-chapter').textContent=item[2];$('#prologue-progress').style.width=`${Number.isFinite(video.duration)?t/video.duration*100:0}%`;}
 function hideBrand(){cancelAnimationFrame(brandFrame);brandFrame=0;overlay.classList.remove('studio-phase');window.dispatchEvent(new CustomEvent('studio-ident',{detail:{active:false}}));}
 function stop(){active=false;hideBrand();video.pause();voice.pause();overlay.hidden=true;overlay.inert=true;document.body.classList.remove('prologue-playing');$('#loader').inert=false;}
 function finish(){if(!active||closing)return;closing=true;stop();try{localStorage.setItem('last-breath-prologue-seen','1');}catch{}if(enterAfter)enter();else $('#watch-story').focus();closing=false;}
 function sound(){silent=!silent;voice.muted=silent;video.muted=silent;$('#prologue-sound').textContent=silent?'声音：关':'声音：开';$('#prologue-sound').setAttribute('aria-pressed',String(!silent));}
 async function beginVideo(){
  if(!active||phase==='video')return;phase='video';hideBrand();try{localStorage.setItem('arthen-ident-seen-v1','1');}catch{}
  $('#prologue-skip').textContent=enterAfter?'跳过剧情，开始远征 →':'返回主菜单 →';$('#prologue-state').textContent='正在接收飞船黑匣子…';
  try{await video.play();if(active)$('#prologue-state').textContent='';}catch{if(active){$('#prologue-state').textContent='点击播放继续，或跳过剧情。';$('#prologue-retry').hidden=false;}}
 }
 function tickBrand(now){if(!active||phase!=='studio')return;const delta=brandLast?Math.min(.1,(now-brandLast)/1000):0;brandLast=now;if(!document.hidden)brandTime+=delta;if(brandTime>=4.8){void beginVideo();return;}brandFrame=requestAnimationFrame(tickBrand);}
 function skip(){if(phase==='studio')void beginVideo();else finish();}
 async function play(after=false){
  if(active)return;active=true;enterAfter=after;phase='studio';brandTime=0;brandLast=0;overlay.hidden=false;overlay.inert=false;$('#loader').inert=true;document.body.classList.add('prologue-playing');overlay.classList.add('studio-phase');$('#prologue-skip').textContent='SKIP INTRO →';$('#prologue-state').textContent='';$('#prologue-retry').hidden=true;
  video.currentTime=0;voice.currentTime=0;voice.muted=silent;video.muted=silent;$('#prologue-skip').focus();cue();
  window.dispatchEvent(new CustomEvent('studio-ident',{detail:{active:true}}));brandFrame=requestAnimationFrame(tickBrand);
 }
 video.addEventListener('playing',()=>{if(!active)return;$('#prologue-state').textContent='';voice.currentTime=video.currentTime;void voice.play().catch(()=>{$('#prologue-state').textContent='英语旁白暂不可用 · 中文字幕继续显示';});});
 video.addEventListener('waiting',()=>{voice.pause();if(active)$('#prologue-state').textContent='缓冲剧情画面…';});
 video.addEventListener('pause',()=>voice.pause());video.addEventListener('timeupdate',cue);video.addEventListener('ended',finish);
 video.addEventListener('error',()=>{if(!active)return;voice.pause();$('#prologue-state').textContent='剧情暂时无法载入。可重试，或跳过进入游戏。';$('#prologue-retry').hidden=false;});
 $('#prologue-retry').onclick=()=>{if(video.error)video.load();$('#prologue-retry').hidden=true;void video.play().catch(()=>{$('#prologue-retry').hidden=false;});};$('#prologue-skip').onclick=skip;$('#prologue-sound').onclick=sound;
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&phase==='video'){video.pause();$('#prologue-retry').hidden=false;$('#prologue-state').textContent='剧情已暂停 · 点击继续播放';}});
 addEventListener('keydown',e=>{if(!active)return;if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();skip();}else if(['Enter','Space'].includes(e.code)&&!e.target.closest('button')){e.preventDefault();e.stopImmediatePropagation();if(phase==='studio')void beginVideo();else if(video.paused)void video.play();else video.pause();}},true);
 return {play,finish,get active(){return active;},requestStart(){let seen=false;try{seen=localStorage.getItem('last-breath-prologue-seen')==='1'&&localStorage.getItem('arthen-ident-seen-v1')==='1';}catch{}if(seen)enter();else void play(true);}};
}
