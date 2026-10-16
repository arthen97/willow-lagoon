import {earthNews,earthAudio} from './earth-client.js';
import {SAMPLE_NAMES,VOICE_LINES} from './story-data.js';
import {createProgress,serializeProgress} from './survival.js';
import {CAMP} from './field-world.js';
const $=s=>document.querySelector(s),STORE='willow-camp-expedition-v3',CAPACITY=120;
export function createExpedition({walker,state,world,notify,openDialog,resume,ambientSound}){
 let saved={};try{saved=JSON.parse(localStorage.getItem(STORE)||'{}');}catch{}
 const progress=createProgress(saved),nodes=world.nodes;
 const game={cargo:saved.cargo||0,reserve:saved.reserve??25,delivered:saved.delivered||0,dew:saved.dew||0,deployments:saved.deployments||{},salvaged:new Set(saved.salvaged||[]),harvesting:false};
 progress.discovered.add('camp');progress.discovered.add('silver-a');
 let sessionTime=saved.sessionTime||0,nearest=null,harvest=null,valve=null,scanReady=0,started=false,muted=false,clip=null,captionTimer,hudClock=0,saveClock=0,lowWarned=false,stormWas=false,radioBusy=false;
 const heard=new Set(),subtitle=$('#subtitles'),journal=$('#journal-dialog'),radio=$('#earth-dialog');
 for(const [id,t]of Object.entries(saved.cooldowns||{}))progress.cooldowns.set(id,t);
 if(Number.isFinite(saved.oxygen))walker.addOxygen(saved.oxygen-walker.oxygen);
 const distance=n=>Math.hypot(n.x-walker.actor.position.x,n.z-walker.actor.position.z);
 function save(){try{localStorage.setItem(STORE,JSON.stringify({...serializeProgress(progress),...game,salvaged:[...game.salvaged],harvesting:false,sessionTime,cooldowns:Object.fromEntries(progress.cooldowns),oxygen:walker.oxygen}));}catch{}}
 function stopVoice(){clip?.pause();clip=null;clearInterval(captionTimer);subtitle.hidden=true;ambientSound.setDucked?.(false);if('speechSynthesis'in window)speechSynthesis.cancel();}
 function speak(id,once=false){
  if(once&&heard.has(id))return;heard.add(id);stopVoice();const text=VOICE_LINES[id];if(!text)return;
  const parts=text.match(/[^。！？]+[。！？]?/g)||[text];let total=0;const cues=parts.map(part=>({text:part,end:total+=part.length}));
  const captions=position=>{$('#subtitle-text').textContent=(cues.find(c=>position<c.end)||cues.at(-1)).text;subtitle.hidden=false;};captions(0);
  const began=performance.now();clip=new Audio(`./assets/story/voice-en/${id}.mp3`);clip.volume=muted?0:.9;ambientSound.setDucked?.(!muted);let failed=false;
  clip.addEventListener('ended',stopVoice,{once:true});clip.addEventListener('error',()=>{failed=true;ambientSound.setDucked?.(false);},{once:true});clip.play().catch(()=>{failed=true;ambientSound.setDucked?.(false);});
  captionTimer=setInterval(()=>{if(clip&&!failed&&Number.isFinite(clip.duration)&&clip.duration>0)captions(clip.currentTime/clip.duration*total);else{const passed=(performance.now()-began)/1000;captions(passed*4.7);if(passed>total/4.7+1)stopVoice();}},150);
 }
 function action(title,detail,pressure=false){$('#field-action').hidden=false;$('#action-title').textContent=title;$('#action-detail').textContent=detail;$('#harvest-meter').hidden=pressure;$('#repair-meter').hidden=!pressure;}
 function cancelHarvest(){harvest=null;game.harvesting=!!valve;if(!valve)$('#field-action').hidden=true;}
 function begin(node,duration,kind){harvest={node,duration,elapsed:0,kind};game.harvesting=true;$('#harvest-fill').style.width='0%';action(kind==='dew'?'保持 E · 取下完整露囊':kind==='feed'?'保持 E · 接入共生肺囊':'保持 E · 接入收集装置','松开或走开即中断 · 气体进入背罐，不会直接补充宇航服');}
 function addCargo(amount,node){const actual=Math.min(amount,CAPACITY-game.cargo);game.cargo+=actual;progress.activated.add(node.id);if(node.species&&node.species!=='red')progress.samples.add(node.species);notify(`氧气入罐 +${actual} L · 背罐 ${Math.round(game.cargo)}/${CAPACITY} L`);save();updateMission();}
 const flowerOpen=n=>(Math.sin(sessionTime*1.2+n.x)+1)/2>.25;
 function interact(){
  if(state.paused||!nearest)return;const n=nearest;progress.discovered.add(n.id);
  if(n.type==='camp'){deposit();return;}
  if(n.type==='archive'){progress.archives.add(n.id);save();speak(n.portrait);notify(n.clue);return;}
  if(n.type==='relay'){notify('旧终端已断电。先把氧气罐送回零号营地，营地天线才能连接地球。');speak('campHint',true);return;}
  if((progress.cooldowns.get(n.id)||0)>sessionTime){notify(`这片生态正在恢复 · ${Math.ceil(progress.cooldowns.get(n.id)-sessionTime)} 秒`);return;}
  if(n.type==='salvage'&&game.salvaged.has(n.id)){notify('应急罐已回收。残骸不会刷新氧气。');return;}
  if(n.species==='red'){walker.addOxygen(-6);progress.cooldowns.set(n.id,sessionTime+20);speak('red',true);notify('刺激性孢子堵塞滤芯 · 宇航服氧气 −6%');return;}
  if(n.species==='dew'){if(game.dew>=3){notify('露囊槽已满 · 先去喂养共生肺囊');return;}begin(n,1.5,'dew');return;}
  if(n.type==='siphon'||n.species==='moss'){
   const d=game.deployments[n.id];if(d){if(d.remaining>0){notify(`抽气器工作中 · 还需 ${Math.ceil(d.remaining)} 秒，可以去别处采集`);return;}if(CAPACITY-game.cargo<40){notify('需要 40 L 空罐容量 · 先回营地卸罐或按 T 应急换气');return;}addCargo(40,n);delete game.deployments[n.id];progress.cooldowns.set(n.id,sessionTime+85);save();speak('pumpReturn',true);return;}
   if(Object.keys(game.deployments).length){notify('只有一台抽气器 · 先收回地图上标记的装置');return;}
   game.deployments[n.id]={remaining:18};save();notify('抽气器已放置 · 18 秒后返回收取 40 L');speak('pumpDeploy',true);return;
  }
  const required=n.type==='lung'?48:n.type==='vent'?32:n.type==='salvage'?24:28;if(CAPACITY-game.cargo<required){notify(`需要 ${required} L 空罐容量 · 回营地卸罐，或按 T 转给宇航服`);return;}
  if(n.type==='lung'){if(!game.dew){notify('它需要营养露液 · 在透明露囊灌木采集后回来');speak('feedHint',true);return;}begin(n,2.8,'feed');return;}
  if(n.type==='vent'){
   if(!valve){valve={node:n,locks:0,last:sessionTime};game.harvesting=true;}
   else if(sessionTime-valve.last>.3){valve.last=sessionTime;const p=(Math.sin(sessionTime*2.2)+1)/2;if(p>.34&&p<.68){valve.locks++;notify(`气阀密封 ${valve.locks}/3`);}else{walker.addOxygen(-4);notify('反压泄漏 · 氧气 −4%');}if(valve.locks>=3){addCargo(32,n);progress.cooldowns.set(n.id,sessionTime+65);valve=null;game.harvesting=false;$('#field-action').hidden=true;return;}}
   action(`潮汐气孔 · 密封 ${valve.locks}/3`,'指针进入浅绿色区域时按 E · 三次密封后充气',true);return;
  }
  if(n.species==='silver'&&!flowerOpen(n)){notify('呼吸花正在闭合 · 等它展开，再接入收集管');return;}
  begin(n,n.type==='salvage'?2:2.2,n.type==='salvage'?'salvage':'flower');
 }
 function finish(){const {node:n,kind}=harvest;
  if(kind==='dew'){game.dew++;progress.samples.add('dew');progress.cooldowns.set(n.id,sessionTime+45);notify(`营养露囊 +1 · ${game.dew}/3 · 用于喂养共生肺囊`);speak('dewCollect',true);}
  else if(kind==='feed'){game.dew--;addCargo(48,n);progress.cooldowns.set(n.id,sessionTime+80);speak('symbiosis',true);}
  else if(kind==='salvage'){game.salvaged.add(n.id);addCargo(24,n);speak('salvage',true);}
  else{addCargo(28,n);progress.cooldowns.set(n.id,sessionTime+55);speak('flower',true);}
  cancelHarvest();save();updateMission();
 }
 function deposit(){if(!game.cargo){notify('营地无自动制氧。出发采集，再把满罐带回来。H 补给宇航服，R 接通地球。');return;}const amount=game.cargo;game.reserve+=amount;game.delivered+=amount;game.cargo=0;progress.activated.add('camp');save();notify(`已卸罐 ${Math.round(amount)} L · 营地储备 ${Math.round(game.reserve)} L · H 补给 / R 通信`);speak('deposit',true);updateMission();}
 function refill(){if(distance(CAMP)>3.8){notify('回到零号营地后才能使用充装台');return;}const amount=Math.min(35,game.reserve,100-walker.oxygen);if(amount<1){notify(game.reserve<1?'营地氧气储备已空':'宇航服已充满');return;}game.reserve-=amount;walker.addOxygen(amount);save();notify(`宇航服补给 +${Math.round(amount)}% · 消耗营地 ${Math.round(amount)} L`);}
 function emergency(){if(state.paused)return;const amount=Math.min(25,game.cargo,100-walker.oxygen);if(amount<1){notify('背罐没有可用氧气，或宇航服已满');return;}game.cargo-=amount;walker.addOxygen(amount);save();notify(`应急转气 +${Math.round(amount)}% · 可带回营地的氧气减少`);}
 async function earth(){
  if(state.paused||radioBusy)return;if(distance(CAMP)>3.8){notify('必须回营地连接固定天线');return;}if(game.delivered<40){notify(`天线生命维持尚未就绪 · 累计带回 ${Math.round(game.delivered)}/40 L`);return;}if(game.reserve<10){notify('通信需要 10 L 营地氧气储备');return;}
  radioBusy=true;game.reserve-=10;save();openDialog(radio);$('#earth-status').textContent='天线锁定 · 搜索最近 24 小时地球新闻…';$('#earth-news').replaceChildren();$('#earth-play').disabled=true;$('#earth-overview').textContent='正在接收地球概况…';
  try{const data=await earthNews();
   $('#earth-status').textContent=`${data.stale?'存档信号':'地球信号已接通'} · ${new Date(data.fetchedAt).toLocaleString('zh-CN')} · ${data.source}`;
   $('#earth-overview').textContent=`母星：地球 / 太阳系第三行星。含氧大气约 21%，海洋覆盖约 71%。以下为现实世界新闻，按来源日期显示；与 2486 年虚构剧情分开。${data.stale?' 当前网络不可用，显示上次接收的存档。':''}`;
   for(const item of data.articles){const article=document.createElement('article'),a=document.createElement('a'),meta=document.createElement('small');a.textContent=item.title;a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';meta.textContent=`${item.source} · ${item.timeLabel||'发布时间'} ${item.publishedAt?new Date(item.publishedAt).toLocaleString('zh-CN'):'来源未提供发布时间'}`;article.append(meta,a);$('#earth-news').append(article);}
   $('#earth-play').disabled=false;$('#earth-play').onclick=()=>playNews(data);progress.complete=true;save();updateMission();
   if(!muted)playNews(data);
  }catch{game.reserve+=10;save();$('#earth-status').textContent='未接收到可核实的新闻 · 本次通信氧气已退回';$('#earth-overview').textContent='地球概况：太阳系第三行星，含氧大气约 21%，海洋覆盖约 71%。';const p=document.createElement('p');p.textContent='新闻搜索服务暂时不可用。继续储存氧气，下次回营地再连接；此处不会生成虚构的“今日大事”。';$('#earth-news').append(p);}
  finally{radioBusy=false;}
 }
 async function playNews(data){stopVoice();if(muted)return;$('#earth-play').disabled=true;$('#earth-play').textContent='正在生成英语广播…';let url;try{url=await earthAudio(data);}catch{$('#earth-play').textContent='英语音频暂不可用 · 请阅读原文';$('#earth-play').disabled=false;return;}$('#earth-play').disabled=false;$('#earth-play').textContent='▶ 重播英语新闻广播';if(!radio.open||muted)return;const audio=new Audio(url);clip=audio;audio.volume=.9;ambientSound.setDucked?.(true);audio.addEventListener('ended',stopVoice,{once:true});audio.play().catch(()=>{$('#earth-status').textContent+=' · 英语广播音频暂不可用，可阅读原文';ambientSound.setDucked?.(false);});}
 $('#close-earth').onclick=()=>{stopVoice();resume();};radio.addEventListener('cancel',e=>{e.preventDefault();stopVoice();resume();});
 function openJournal(){openDialog(journal);$('#journal-entries').replaceChildren();const notes=[`带回营地 ${Math.round(game.delivered)} L · 储备 ${Math.round(game.reserve)} L。采集气体进入背罐；按 T 应急换气，回营地 E 卸罐、H 补给、R 通信。`,'银色呼吸花：观察开合，展开后保持 E 连接收集管。55 秒恢复。','透明露囊：保持 E 采集营养液；喂给骨白色肺囊，换取 48 L 氧气。','洞内蓝脉菌床：按 E 放置抽气器，18 秒后回来收取 40 L。装置只有一台。','潮汐气孔：在压力表绿色区域按 E，完成三次密封，取得 32 L。','坠毁货舱：回收一只应急氧气罐，24 L，仅可取一次。','新闻终端接收现实世界新闻。TRAPPIST-1 e 上的生态、遗迹、未来名人留言均属虚构。'];for(const text of notes){const p=document.createElement('p');p.textContent=text;$('#journal-entries').append(p);}for(const n of nodes.filter(n=>progress.archives.has(n.id))){const h=document.createElement('h3'),p=document.createElement('p');h.textContent=n.title;p.textContent=n.clue;$('#journal-entries').append(h,p);}}
 $('#journal-open').onclick=openJournal;$('#close-journal').onclick=()=>resume();journal.addEventListener('cancel',e=>{e.preventDefault();resume();});
 addEventListener('keydown',e=>{if(!state.gameStarted||e.target.matches?.('input,textarea'))return;if(e.code==='KeyJ'&&!e.repeat){e.preventDefault();if(journal.open)resume();else if(!state.paused)openJournal();}if(state.paused||e.repeat)return;if(e.code==='KeyQ')scan();if(e.code==='KeyT')emergency();if(e.code==='KeyH')refill();if(e.code==='KeyR')void earth();});
 addEventListener('keyup',e=>{if(e.code==='KeyE')cancelHarvest();});
 $('#interact').addEventListener('pointerdown',e=>{e.preventDefault();$('#interact').setPointerCapture(e.pointerId);interact();});for(const name of ['pointerup','pointercancel','lostpointercapture'])$('#interact').addEventListener(name,cancelHarvest);
 $('#tank-transfer').onclick=emergency;$('#camp-refill').onclick=refill;$('#camp-radio').onclick=()=>void earth();$('#scan-button').onclick=scan;
 function scan(){if(state.paused)return;if(sessionTime<scanReady){notify(`扫描冷却 · ${Math.ceil(scanReady-sessionTime)} 秒`);return;}scanReady=sessionTime+12;world.scanUntil=sessionTime+6;let count=0;for(const n of nodes)if(distance(n)<22){if(!progress.discovered.has(n.id))count++;progress.discovered.add(n.id);}notify(`发现 ${count} 处新生态信号 · 扫描不耗氧`);save();}
 function updateMission(){const returning=game.cargo>=55||game.cargo>0&&walker.oxygen<35;$('#mission-title').textContent=returning?'带着氧气，活着回营地':game.delivered>=40?'保持呼吸 · 与地球联系':'把第一批氧气带回营地';$('#mission-detail').textContent=returning?'E 卸罐 · H 补给 · R 地球广播':`累计回收 ${Math.floor(game.delivered)} L / ${game.delivered>=40?'持续维持营地':'40 L 解锁通信'} · 氧气需要不断采集`;$('#sample-count').textContent=`${Math.floor(game.delivered)} L`;}
 function target(){if(game.cargo>=55||walker.oxygen<30||game.delivered>=40&&game.reserve>=10&&!progress.complete)return CAMP;const pump=Object.keys(game.deployments)[0];if(pump&&game.deployments[pump].remaining<=0)return nodes.find(n=>n.id===pump);const opts=nodes.filter(n=>progress.discovered.has(n.id)&&['plant','salvage','lung','vent','siphon'].includes(n.type)&&n.species!=='red'&&(progress.cooldowns.get(n.id)||0)<=sessionTime&&!(n.type==='salvage'&&game.salvaged.has(n.id))&&!(n.type==='lung'&&!game.dew));return opts.sort((a,b)=>distance(a)-distance(b))[0]||CAMP;}
 function update(dt){
  if(!started)return;if(state.paused){cancelHarvest();return;}sessionTime+=dt;saveClock+=dt;
  const phase=sessionTime%145,storm=phase>100&&phase<127,sheltered=world.field.isSheltered(walker.actor.position);state.storm=storm?1:0;state.sheltered=sheltered;
  if(storm&&!stormWas){speak('stormCamp');notify('孢子锋面到达 · 洞窟和营地可避风');}stormWas=storm;
  if(storm&&!sheltered)walker.addOxygen(-dt*.30);
  // Camp air is drawn from real stored gas; it never creates free oxygen.
  if(distance(CAMP)<3.6&&game.reserve>0){const used=Math.min(game.reserve,dt*.30);game.reserve-=used;walker.addOxygen(used);}
  for(const d of Object.values(game.deployments))d.remaining=Math.max(0,d.remaining-dt);
  if(harvest){if(distance(harvest.node)>2.8||walker.motionSpeed>.4)cancelHarvest();else{harvest.elapsed+=dt;$('#harvest-fill').style.width=Math.min(100,harvest.elapsed/harvest.duration*100)+'%';if(harvest.elapsed>=harvest.duration)finish();}}
  if(valve){if(distance(valve.node)>3){valve=null;game.harvesting=false;$('#field-action').hidden=true;}else $('#repair-needle').style.left=((Math.sin(sessionTime*2.2)+1)*50)+'%';}
  if(walker.oxygen<23&&!lowWarned){lowWarned=true;speak('lowCamp');notify('氧气偏低 · T 使用背罐，或回营地 H 补给');}if(walker.oxygen>40)lowWarned=false;
  if(walker.oxygen<=0){cancelHarvest();valve=null;$('#field-action').hidden=true;const reserve=Math.min(40,game.reserve);game.reserve-=reserve;game.cargo=Math.floor(game.cargo*.5);walker.respawn({x:CAMP.x,z:CAMP.z-2.5},Math.max(30,reserve));notify('应急拖回营地 · 散失一半背罐气体，线索保留');speak('death');save();}
  world.update(sessionTime,progress);world.field.update(sessionTime,game);ambientSound.update?.(walker.actor.position);
  for(const n of nodes)if(n.species==='silver'&&n.object)n.object.scale.y=(n.object.userData.restScaleY||1)*(.8+(Math.sin(sessionTime*1.2+n.x)+1)*.18);
  if(saveClock>10){saveClock=0;save();}
  hudClock+=dt;if(hudClock<.15)return;hudClock=0;
  let best=2.7;nearest=null;for(const n of nodes){const d=distance(n);if(d<7)progress.discovered.add(n.id);if(d<best){best=d;nearest=n;}}
  $('#interact').hidden=!nearest;if(nearest){const n=nearest;let prompt=n.type==='camp'?'卸下背罐':n.type==='archive'?'播放留言':n.type==='lung'?game.dew?'保持 E · 喂养取气':'需要营养露囊':n.type==='siphon'||n.species==='moss'?game.deployments[n.id]?game.deployments[n.id].remaining>0?`抽气中 ${Math.ceil(game.deployments[n.id].remaining)}s`:'收回满罐':'放置抽气器':n.type==='vent'?'按 E · 密封取气':n.species==='silver'?flowerOpen(n)?'展开 · 保持 E 接气':'闭合 · 等待展开':'保持 E 收集';$('#interact-label').textContent=n.name+' · '+prompt;}
  $('#cargo-value').textContent=Math.floor(game.cargo);$('#cargo-fill').style.width=game.cargo/CAPACITY*100+'%';$('#camp-reserve').textContent=Math.floor(game.reserve)+' L';$('#dew-value').textContent=game.dew+'/3';$('#camp-actions').hidden=distance(CAMP)>3.8;$('#scan-cooldown').textContent=sessionTime<scanReady?`${Math.ceil(scanReady-sessionTime)}s`:'扫描';
  $('#event-label').textContent=storm?sheltered?'洞窟 / 营地掩护':'孢子锋面 · 额外耗氧':'下一次孢子锋面';$('#event-time').textContent=Math.ceil(storm?127-phase:phase<=100?100-phase:245-phase)+'s';$('#event-banner').dataset.danger=String(storm&&!sheltered);
  $('#biome-label').textContent=Math.abs(walker.actor.position.x+18)<5&&walker.actor.position.z>34?'蓝脉洞窟':walker.actor.position.z>20?'骨帆共生林':'坠落湾 · 零号营地';updateMission();
 }
 addEventListener('pagehide',save);
 updateMission();return {update,interact,target,progress,nodes,game,openJournal,scan,stopVoice,cancelHarvest,deposit,refill,earth,emergency,get sessionTime(){return sessionTime;},get repair(){return !!valve;},setMuted(value){muted=value;if(clip)clip.volume=value?0:.9;ambientSound.setDucked?.(!!clip&&!value);},start(){started=true;speak('campIntro',true);updateMission();}};
}
