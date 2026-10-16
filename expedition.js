import {earthNews,earthAudio} from './earth-client.js';
import {VOICE_LINES} from './story-data.js';
import {createProgress,serializeProgress} from './survival.js';
import {CAMP} from './field-world.js';
import {ARC_VOICE,CHAPTERS,BRIEFS,ARCHIVE_CLUES,WINDOW_SECONDS,UPLOAD_SECONDS,UPLOAD_OXYGEN} from './planet-story.js?v=20261017-arc';
import {createPlanetUI} from './planet-ui.js?v=20261017-fieldkit';
const $=s=>document.querySelector(s),STORE='willow-planet-arc-v1',CAPACITY=120;
const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
export function createExpedition({walker,state,world,notify,openDialog,resume,ambientSound}){
 const saved=read(STORE)||{},legacy=read('willow-camp-expedition-v3');
 const progress=createProgress(saved.oxygen===undefined?{archives:legacy?.archives||[]}:saved),nodes=world.nodes;
 const game={cargo:0,reserve:25,delivered:0,dew:0,deployments:{},harvesting:false,relayStage:0,batches:[],deliveredAmounts:{},statueHits:{},overdraws:0,rootRestored:false,observed:false,upload:0,uploading:false,signature:'protect',complete:false,exploring:false,rescueReserve:30,rescues:0,retries:0,fed:{},shelterSeen:false,...saved,salvaged:new Set(saved.salvaged||[]),uploading:false,harvesting:false};
 progress.complete=game.complete;progress.discovered.add('camp');progress.discovered.add('silver-a');
 for(const [id,t] of Object.entries(saved.cooldowns||{}))progress.cooldowns.set(id,t);
 const heard=new Set(saved.heard||[]);let checkpoint=saved.checkpoint||null;
 let sessionTime=saved.sessionTime||0,nearest=null,harvest=null,valve=null,scanReady=0,started=false,muted=false,clip=null,captionTimer,voicePriority=0,voiceEnd=0,hudClock=0,saveClock=0,lowWarned=false,stormWas=false,stormWarned=-1,strikeReady=0,banterReady=0,radioEpoch=0;
 const subtitle=$('#subtitles'),journal=$('#journal-dialog'),radio=$('#earth-dialog');
 const distance=n=>Math.hypot(n.x-walker.actor.position.x,n.z-walker.actor.position.z);
 const kind=n=>n.type==='siphon'||n.species==='moss'?'cave':n.type==='lung'?'lung':n.type==='vent'?'vent':n.species||'salvage';
 const ui=createPlanetUI({game,state,walker,openDialog,resume,retry,explore,alternate});
 if(Number.isFinite(saved.oxygen))walker.addOxygen(saved.oxygen-walker.oxygen);
 // Restore the saved position and resources together; never turn reload into a free return trip.
 if(saved.position)walker.respawn(saved.position,saved.oxygen??60);
 function serial(){const {checkpoint:ignored,...values}=game;return {...serializeProgress(progress),...values,salvaged:[...game.salvaged],heard:[...heard],harvesting:false,uploading:false,sessionTime,cooldowns:Object.fromEntries(progress.cooldowns),oxygen:walker.oxygen,position:{x:walker.actor.position.x,z:walker.actor.position.z}};}
 function save(){try{localStorage.setItem(STORE,JSON.stringify({...serial(),checkpoint}));}catch{}}
 function markCheckpoint(){checkpoint=serial();save();}
 function retry(fresh){const knowledge=[...progress.archives],memo=[...heard];const next=fresh?{retries:0}:checkpoint?structuredClone(checkpoint):{};next.retries=fresh?0:game.retries+1;next.archives=knowledge;next.heard=memo;next.complete=false;next.exploring=false;next.uploading=false;try{localStorage.setItem(STORE,JSON.stringify({...next,checkpoint:fresh?null:checkpoint}));}catch{}location.reload();}
 function explore(){game.exploring=true;game.uploading=false;save();resume();speak('arc16_dawn',true,2);}
 function stopVoice(){clip?.pause();clip=null;clearInterval(captionTimer);subtitle.hidden=true;ambientSound.setDucked?.(false);voicePriority=0;}
 function speak(id,once=false,priority=1){
  if(once&&heard.has(id)||voicePriority>priority&&performance.now()<voiceEnd)return;
  const text=ARC_VOICE[id]?.zh||VOICE_LINES[id];if(!text)return;heard.add(id);stopVoice();voicePriority=priority;voiceEnd=performance.now()+Math.max(6000,text.length*230);
  $('#subtitle-text').textContent=text;subtitle.hidden=false;
  const audio=new Audio(`./assets/story/${ARC_VOICE[id]?'voice-arc':'voice-en'}/${id}.mp3`);clip=audio;audio.volume=muted?0:.9;ambientSound.setDucked?.(!muted);
  const done=()=>{if(clip===audio)stopVoice();};audio.addEventListener('ended',done,{once:true});audio.addEventListener('error',()=>ambientSound.setDucked?.(false),{once:true});audio.play().catch(()=>ambientSound.setDucked?.(false));captionTimer=setTimeout(done,Math.max(8000,text.length*240));
 }
 function action(title,detail,pressure=false){$('#field-action').hidden=false;$('#action-title').textContent=title;$('#action-detail').textContent=detail;$('#harvest-meter').hidden=pressure;$('#repair-meter').hidden=!pressure;}
 function cancelHarvest(){harvest=null;game.harvesting=!!valve;if(!valve)$('#field-action').hidden=true;}
 function begin(node,duration,mode){harvest={node,duration,elapsed:0,mode};game.harvesting=true;$('#harvest-fill').style.width='0%';const titles={insert:'保持 E · 插罐并释放氧气',dew:'保持 E · 取下露囊',feed:'保持 E · 喂养，等待排气',gentle:'保持 E · 顺着排气收集',force:'强抽中 · 此处将休眠 180 秒',repair:'保持 E · 回灌根床并关闭旧泵',listen:'保持 E · 观察湖岸的起伏'};action(titles[mode]||'保持 E · 接入收集管',mode==='repair'?'消耗 1 份露液与背罐 12 L · 持续影响保存在场景中':mode==='listen'?'氧气依然消耗 · 松开可随时离开':'松开 E 可中止 · 背罐气体可按 T 应急转给宇航服');}
 function syncCargo(){game.cargo=game.batches.reduce((s,b)=>s+b.amount,0);game.cargoKinds=[...new Set(game.batches.map(b=>b.kind))];}
 function consumeCargo(amount){let left=Math.min(amount,game.cargo);const taken=left;for(const b of game.batches){const n=Math.min(left,b.amount);b.amount-=n;left-=n;if(left<=0)break;}game.batches=game.batches.filter(b=>b.amount>.001);syncCargo();return taken;}
 function addCargo(amount,n){const actual=Math.min(amount,CAPACITY-game.cargo);if(actual<=0)return 0;game.batches.push({kind:kind(n),amount:actual});syncCargo();progress.activated.add(n.id);notify(`收回 ${Math.round(actual)} L · 背罐 ${Math.round(game.cargo)}/${CAPACITY} L`);save();return actual;}
 const flowerOpen=n=>(Math.sin(sessionTime*1.2+n.x)+1)/2>.25;
 const exhaling=n=>(Math.sin(sessionTime*1.3+n.x)+1)/2>.45;
 function remaining(n){return Math.max(0,(progress.cooldowns.get(n.id)||0)-sessionTime);}
 function takePump(n){const d=game.deployments[n.id],amount=Math.floor(60*(1-d.remaining/18));if(amount<1){notify('收集器刚接入，尚未储气');return;}if(CAPACITY-game.cargo<amount){notify(`需留出 ${amount} L 空间；先 T 转气，或回营卸罐`);return;}addCargo(amount,n);delete game.deployments[n.id];progress.cooldowns.set(n.id,sessionTime+90);speak('arc08_pump_return',true);save();}
 function interact(){
  if(state.paused||!nearest||harvest)return;const n=nearest;progress.discovered.add(n.id);
  if(n.type==='camp'){if(game.cargo>0)begin(n,2.4,'insert');else void earth();return;}
  if(n.type==='archive'){notify((game.statueHits[n.id]||0)>=3?ARCHIVE_CLUES[n.id]:'地球文化展园的广告遗物。停稳后按 F 敲开封层，寻找维修记录。');speak(n.portrait,true);return;}
  if(n.type==='relay'){notify('旧殖民制氧台已废弃。湖岸的生态仍在运行，观察它，再回零号营地使用通信天线。');return;}
  if(n.type==='wound'){if(game.rootRestored){notify('旧泵已停机，根床正在按自己的节律恢复');return;}if(game.relayStage<3){notify('废泵仍在抽取根床。先完成共生调查，地球才能发来回灌方法。');return;}if(game.dew<1||game.cargo<12){notify('回灌需要 1 份露液和背罐 12 L。你需要自己为这次修复留出资源。');return;}begin(n,4,'repair');return;}
  if(n.type==='listen'){if(!game.rootRestored){notify('湖岸的起伏被旧泵干扰。先去关闭根床旁的废泵。');return;}if(game.observed){speak('arc13_lakeshore',true);notify('波动继续向远处传播。它并没有因你停下而停止。');return;}begin(n,6,'listen');return;}
  if(remaining(n)>0){notify(`此处正在恢复 · ${Math.ceil(remaining(n))} 秒`);return;}
  if(n.species==='red'){walker.addOxygen(-6);progress.cooldowns.set(n.id,sessionTime+25);speak('red',true,2);return;}
  if(n.type==='salvage'&&game.salvaged.has(n.id)){notify('应急罐已经回收');return;}
  if(n.species==='dew'){if(game.dew>=3){notify('露囊已满 · 喂养肺囊或给根床回灌');return;}begin(n,1.5,'dew');return;}
  if(n.type==='siphon'||n.species==='moss'){if(game.deployments[n.id]){if(game.deployments[n.id].remaining>0){notify(`还需 ${Math.ceil(game.deployments[n.id].remaining)} 秒满罐；X 可提前收回已有气体`);return;}takePump(n);return;}if(Object.keys(game.deployments).length){notify('只有一台泵，先收回已部署的装置');return;}game.deployments[n.id]={remaining:18};speak('arc05_pump',true);notify('收集器已部署 · 18 秒 / 60 L。可以沿途采露液，或留在洞里避风。');save();return;}
  if(n.type==='lung'){
   if(!game.fed[n.id]){if(!game.dew){notify('需要 1 份露液 · 东侧透明露囊灌木可以采到');return;}begin(n,2,'feed');return;}
   if(!exhaling(n)){notify('它正在吸气 · 等身体舒展后保持 E 取氧，X 可强抽但会延长休眠');return;}if(CAPACITY-game.cargo<48){notify('普通收取需要 48 L 背罐空间');return;}begin(n,2.8,'gentle');speak('arc10_exhale',true);return;
  }
  if(n.type==='vent'){if(CAPACITY-game.cargo<48){notify('需要 48 L 空罐空间');return;}if(!valve){valve={node:n,locks:0,last:sessionTime};game.harvesting=true;speak('arc14_final_valve',true);}else if(sessionTime-valve.last>.3){valve.last=sessionTime;const p=(Math.sin(sessionTime*1.6)+1)/2;if(p>.28&&p<.72){valve.locks++;notify(`已密封 ${valve.locks}/3 · 每段 16 L`);}else{walker.addOxygen(-4);notify('反压泄漏 · 宇航服 −4%');}if(valve.locks>=3){takeValve();return;}}action(`潮汐气孔 · ${valve.locks}/3`,'指针进入绿区按 E · X 提前取走已密封的气体',true);return;}
  if(n.species==='silver'&&!flowerOpen(n)){notify('叶片正在闭合 · 观察展开再接管');speak('arc02_closed',true);return;}
  if(CAPACITY-game.cargo<(n.type==='salvage'?24:28)){notify('背罐空间不足 · T 转气，或回营地插罐');return;}begin(n,2.2,n.type==='salvage'?'salvage':'flower');
 }
 function takeValve(){if(!valve)return;const n=valve.node,amount=valve.locks*16;if(amount){addCargo(amount,n);progress.cooldowns.set(n.id,sessionTime+75);}valve=null;game.harvesting=false;$('#field-action').hidden=true;save();}
 function alternate(){if(state.paused||!nearest)return;if(harvest){notify('先松开采集操作');return;}const n=nearest;if(valve){takeValve();return;}if(game.deployments[n.id]){takePump(n);return;}if(n.type==='lung'&&game.fed[n.id]&&!remaining(n)){if(CAPACITY-game.cargo<70){notify('强抽需要 70 L 空间');return;}begin(n,1.2,'force');}}
 function finish(){const {node:n,mode}=harvest;
  if(mode==='insert'){deposit();cancelHarvest();return;}
  if(mode==='dew'){game.dew++;progress.cooldowns.set(n.id,sessionTime+45);notify(`露液 ${game.dew}/3 · 可喂养或回灌`);speak('dewCollect',true);}
  else if(mode==='feed'){if(game.dew<1){cancelHarvest();return;}game.dew--;game.fed[n.id]=true;notify('它吸收了露液 · 看身体舒展，排气时 E 收取；X 强抽 70 L / 休眠 180 秒');speak('arc09_feed',true);}
  else if(mode==='gentle'||mode==='force'){const force=mode==='force';if(CAPACITY-game.cargo<(force?70:48)){cancelHarvest();return;}addCargo(force?70:48,n);delete game.fed[n.id];progress.cooldowns.set(n.id,sessionTime+(force?180:65));if(force)game.overdraws++;speak(force?'arc12_overdraw':'arc11_release',true);}
  else if(mode==='repair'){if(game.dew<1||game.cargo<12){cancelHarvest();return;}game.dew--;consumeCargo(12);game.rootRestored=true;notify('旧泵已关闭 · 根床恢复流动。前往湖岸，观察六秒。');speak('arc18_restored',true,2);}
  else if(mode==='listen'){game.observed=true;notify('观察已记录 · 不同生物的起伏相互关联。下一步回收 16 L 潮汐气体，带回营地。');speak('arc13_lakeshore',true,2);}
  else if(mode==='salvage'){game.salvaged.add(n.id);addCargo(24,n);speak('salvage',true);}
  else{addCargo(28,n);progress.cooldowns.set(n.id,sessionTime+(n.id==='silver-a'?240:70));speak('arc03_first_breath',true);}
  cancelHarvest();save();updateMission();
 }
 function deposit(){if(!game.cargo)return;const amount=game.cargo;for(const b of game.batches)game.deliveredAmounts[b.kind]=(game.deliveredAmounts[b.kind]||0)+b.amount;game.reserve+=amount;game.delivered+=amount;game.batches=[];syncCargo();game.insertedAt=sessionTime;progress.activated.add('camp');notify(`插罐完成 · 储备 ${Math.floor(game.reserve)} L。H 补给，R 查看通信与下一步。`);speak('arc04_first_return',true);save();}
 function refill(){if(state.paused||distance(CAMP)>3.8)return;const amount=Math.min(35,game.reserve,100-walker.oxygen);if(amount<1){notify(game.reserve<1?'营地储备已空':'宇航服已满');return;}game.reserve-=amount;walker.addOxygen(amount);save();notify(`宇航服 +${Math.round(amount)}% · 储备 −${Math.round(amount)} L`);}
 function emergency(){if(state.paused)return;const amount=Math.min(25,game.cargo,100-walker.oxygen);if(amount<1){notify('背罐没有气体，或宇航服已满');return;}consumeCargo(amount);walker.addOxygen(amount);save();notify(`转气 +${Math.round(amount)}% · 可用于交付的对应气体减少`);}
 function readyStage(){return game.relayStage===0?game.delivered>=28:game.relayStage===1?(game.deliveredAmounts.cave||0)>=20:game.relayStage===2?(game.deliveredAmounts.lung||0)>=24:game.relayStage===3?game.rootRestored&&game.observed&&(game.deliveredAmounts.vent||0)>=16:false;}
 async function earth(){
  if(state.paused||distance(CAMP)>3.8)return;
  if(game.relayStage===0&&game.delivered<28){notify('先将第一罐 28 L 蓝息质带回营地，保持 E 插罐，才能启动通信。');return;}
  if(game.uploading){game.uploading=false;save();notify('上行暂停 · 已确认进度保留。补给后按 R 继续。');return;}
  const epoch=++radioEpoch,stage=game.relayStage,brief=BRIEFS[Math.min(stage,4)],ready=readyStage();openDialog(radio);$('#earth-bulletin').open=false;ui.signature.hidden=stage!==4||game.complete;
  $('#earth-task-title').textContent=brief.title;$('#earth-task-message').textContent=brief.body;$('#earth-task-clue').textContent=stage===4&&!game.complete?`上行 ${Math.floor(game.upload/UPLOAD_SECONDS*100)}% · 通信还需 ${Math.ceil(UPLOAD_OXYGEN*(1-game.upload/UPLOAD_SECONDS))} L。先保持宇航服 ≥35%，营地预留通信与呼吸用氧。`:!ready&&stage<4?objective().detail+' 完成当前调查后，这次通信才会升级。':brief.clue;
  $('#earth-accept').textContent=game.complete?'查看本章结算':stage===4?'开始 / 继续上行 →':ready?`${brief.reward} · 确认通信 8 L`:'记录已读 · 继续远征 →';
  $('#earth-accept').onclick=()=>{
   if(game.complete){resume();showEnding();return;}
   if(stage===4){const required=(UPLOAD_SECONDS-game.upload)*.7;if(walker.oxygen<35||game.reserve<required){notify(`准备不足：宇航服需 35%，储备需 ${Math.ceil(required)} L（含通信与营地呼吸）`);$('#earth-task-clue').textContent='先断开通信，用 H 补气；储备不够时再走一趟采集路线。';return;}game.signature=ui.choice();game.uploading=true;save();resume();notify('上行开始 · 留在营地，R 可暂停；传输时仍需呼吸。');return;}
   if(ready){if(game.reserve<8){$('#earth-task-clue').textContent='本次有效通信需要 8 L 燃料电池氧化剂；先回收补足，重读不收费。';return;}game.reserve-=8;game.relayStage++;if(brief.node)progress.discovered.add(brief.node);if(game.relayStage>=2){progress.discovered.add('dew-a');progress.discovered.add('lung-a');}if(game.relayStage>=3){progress.discovered.add('root-wound');progress.discovered.add('lake-listen');}markCheckpoint();}
   stopVoice();resume();if(game.relayStage===3)speak('arc17_repair',true,2);updateMission();
  };
  $('#earth-status').textContent='任务频道就绪 · 现实新闻另行接收';$('#earth-news').replaceChildren();$('#earth-play').disabled=true;
  try{const data=await earthNews();if(epoch!==radioEpoch||!radio.open)return;$('#earth-status').textContent=`${data.stale?'存档新闻':'新闻频道'} · ${new Date(data.fetchedAt).toLocaleString('zh-CN')}`;$('#earth-overview').textContent='现实日期的新闻档案，独立于 2486 年虚构剧情。任务不依赖新闻或音频加载。';for(const item of data.articles){const p=document.createElement('p'),a=document.createElement('a');a.textContent=item.title;a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a);$('#earth-news').append(p);}$('#earth-play').disabled=false;$('#earth-play').textContent='▶ 收听英语新闻';$('#earth-play').onclick=()=>playNews(data);}catch{if(epoch===radioEpoch)$('#earth-status').textContent='新闻暂不可用 · 任务频道正常';}
 }
 async function playNews(data){stopVoice();if(muted)return;const epoch=radioEpoch;try{const url=await earthAudio(data);if(!radio.open||epoch!==radioEpoch||muted)return;clip=new Audio(url);clip.volume=.9;ambientSound.setDucked?.(true);clip.addEventListener('ended',stopVoice,{once:true});await clip.play();}catch{ambientSound.setDucked?.(false);$('#earth-status').textContent='音频暂不可用，可阅读新闻原文';}}
 $('#close-earth').onclick=()=>{radioEpoch++;stopVoice();resume();};radio.addEventListener('cancel',e=>{e.preventDefault();radioEpoch++;stopVoice();resume();});
 function openJournal(){openDialog(journal);$('#journal-entries').replaceChildren();const notes=[`${CHAPTERS[Math.min(game.relayStage,4)]} · 已回收 ${Math.floor(game.delivered)} L。宇航服、背罐、营地独立记账；转气会减少可交付的材料。`,'近营地呼吸花 240 秒恢复，外部银叶 70 秒。首株是应急缓冲，无法无限安全供氧。','一台泵，18 秒收集 60 L；X 可提前收回已收集部分。洞穴能避风。','露液喂肺囊。它舒展排气时 E 收取 48 L，65 秒恢复；X 强抽 70 L，180 秒恢复。','潮汐阀每锁定一段封存 16 L；X 可提前带走，失误损失宇航服 4%。','旧泵回灌需要 1 份露液、背罐 12 L。修复改变现场流动，不赠送无限氧气。','低氧可 T 转气。一次救援只使用显示的救援瓶与真实储备；用尽后可从完整通信检查点重试。','此地的同步变化未必是语言。旧殖民记录、名人展品与中继技术是原创虚构设定。'];for(const text of notes){const p=document.createElement('p');p.textContent=text;$('#journal-entries').append(p);}for(const id of progress.archives){if(!ARCHIVE_CLUES[id])continue;const p=document.createElement('p');p.textContent=ARCHIVE_CLUES[id];$('#journal-entries').append(p);}}
 $('#journal-open').onclick=openJournal;$('#close-journal').onclick=()=>resume();journal.addEventListener('cancel',e=>{e.preventDefault();resume();});
 function nearbyStatue(){return nodes.find(n=>n.type==='archive'&&n.object&&Math.hypot(n.object.position.x-walker.actor.position.x,n.object.position.z-walker.actor.position.z)<2.2);}
 function strike(){if(!started||state.paused||sessionTime<strikeReady)return;const n=nearbyStatue();if(!n){notify('靠近雕像，停稳后按 F');return;}if(walker.airborne||walker.motionSpeed>.8){notify('停稳后再敲击');return;}cancelHarvest();strikeReady=sessionTime+.65;walker.face?.(n.object.position.x,n.object.position.z);walker.animation.strike?.();world.hitStatue?.(n);ambientSound.impact?.();game.statueHits[n.id]=(game.statueHits[n.id]||0)+1;if(game.statueHits[n.id]===3){progress.archives.add(n.id);notify(ARCHIVE_CLUES[n.id]);speak('arc07_statue',true,2);if(n.id==='musk')progress.discovered.add('root-wound');}else if(sessionTime>banterReady){banterReady=sessionTime+12;speak(n.portrait,true);notify(`敲击 ${game.statueHits[n.id]}/3 · 广告封层后的维修笔记`);}save();}
 function scan(){if(state.paused||sessionTime<scanReady)return;scanReady=sessionTime+12;world.scanUntil=sessionTime+6;for(const n of nodes)if(distance(n)<22)progress.discovered.add(n.id);notify('扫描到附近生态与人工设备 · 亮起不代表它们为你而存在');save();}
 function objective(){const stage=game.relayStage,find=id=>nodes.find(n=>n.id===id)||CAMP;
  if(game.complete)return {title:'坐标已确认 · 自由观察',detail:'氧气依然有限。可以回营补给，或前往湖岸再看一会儿。',node:find('lake-listen')};
  if(game.uploading)return {title:'上行中 · '+Math.floor(game.upload/UPLOAD_SECONDS*100)+'%',detail:'留在营地 · R 暂停传输 · H 补气。已确认进度保留。',node:CAMP};
  if(walker.oxygen<22)return {title:'先保住这一口气',detail:game.cargo>0?'T 将背罐气体转给宇航服，再决定是否回营。':'回营 H 补给，或就近寻找可用氧源。',node:game.reserve>0?CAMP:nodes.filter(n=>n.species==='silver'&&!remaining(n)).sort((a,b)=>distance(a)-distance(b))[0]||CAMP};
  if(readyStage())return {title:'回营地 · 这次通话会改变下一趟',detail:'R 查看有效通信奖励，消耗 8 L。先用 H 为下一次远征补气。',node:CAMP};
  const cargo=k=>game.batches.filter(b=>b.kind===k).reduce((s,b)=>s+b.amount,0),needs=stage===1?'cave':stage===2?'lung':stage===3?'vent':'silver',amount=stage===1?20:stage===2?24:stage===3?16:28;
  if(game.cargo>=100||(stage!==3||game.rootRestored&&game.observed)&&(game.deliveredAmounts[needs]||0)+cargo(needs)>=amount&&cargo(needs)>0)return {title:'带回这批气体 · 插入营地接口',detail:'靠近营地保持 E。也可以继续环线，但要预留呼吸与背罐空间。',node:CAMP};
  if(stage===0)return {title:'抢回第一口气',detail:'银白叶片展开时保持 E，装罐带回营地。',node:find('silver-a')};
  if(stage===1){const id=Object.keys(game.deployments)[0];return {title:id?'让它按自己的时间工作':'到西南洞窟 · 观察菌床',detail:id?'泵满罐前可以取附近露液；X 可提前收回已有气体。':'E 放下唯一收集器，18 秒最多 60 L；带回至少 20 L 洞穴气体。',node:find(id||'cave-siphon')};}
  if(stage===2){const fed=Object.keys(game.fed)[0];return {title:fed?'等它排气，再决定取多少':game.dew?'把露液交给肺囊':'先取一份透明露液',detail:'正常收取 48 L / 65 秒恢复；强抽 70 L / 180 秒休眠。带回 24 L。',node:find(fed||(game.dew?'lung-a':'dew-a'))};}
  if(stage===3){if(!game.rootRestored)return {title:game.dew&&game.cargo>=12?'给这个地方留下一点':'为根床留一份露液与 12 L',detail:'修复旧泵需要消耗自己的资源；根床在断柱附近。',node:find(!game.dew?'dew-a':game.cargo<12?'vent-a':'root-wound')};if(!game.observed)return {title:'湖岸出现了不同的起伏',detail:'前往观测点，保持 E 观察六秒；氧气仍在消耗。',node:find('lake-listen')};return {title:'顺着潮汐完成最后校准',detail:'气孔每段封存 16 L；X 提前收取。将至少 16 L 带回营地。',node:find('vent-a')};}
  return {title:'最后一声呼叫',detail:'回营：宇航服 ≥35%，储备 ≥42 L；R 开始上行。氧气不足时自由选择采集路线。',node:CAMP};
 }
 function updateMission(){const o=objective();$('#mission-title').textContent=o.title;$('#mission-detail').textContent=o.detail;const phase=o.node.id==='camp'?(game.cargo>0?1:2):0;document.querySelectorAll('.mission-steps li').forEach((el,i)=>el.dataset.active=String(i===phase));$('#sample-count').textContent=`${Math.floor(game.delivered)} L`;}
 function showEnding(){ui.ending(false,game.signature==='observe'?'你请求补给，并留下了继续观察的意愿。这个星球没有答应任何事；你却开始期待它的下一次日出。':'你发送了求救坐标，也附上“请勿再次强采”的记录。你仍然想回家，但已经不再把这里当作一片需要被修好的荒地。');speak('arc15_contact',true,2);}
 function fail(message){game.uploading=false;cancelHarvest();valve=null;game.harvesting=false;$('#field-action').hidden=true;save();ui.ending(true,message+' 线索保留；重试会恢复整套阶段资源，不会把新货物叠加到旧库存。');}
 function update(dt){
  if(!started)return;if(state.paused){cancelHarvest();return;}sessionTime+=dt;saveClock+=dt;
  const phase=sessionTime%160,storm=phase>120&&phase<150,sheltered=world.field.isSheltered(walker.actor.position);state.storm=storm?1:0;state.sheltered=sheltered;
  if(game.relayStage>0&&phase>100&&phase<120&&stormWarned!==Math.floor(sessionTime/160)){stormWarned=Math.floor(sessionTime/160);notify('20 秒内锋面抵达 · 检查回程与洞穴路线');}
  if(storm&&!stormWas){speak('stormCamp',false,3);notify('孢子锋面到达 · 洞穴和营地可避风');}stormWas=storm;
  if(storm&&!sheltered)walker.addOxygen(-dt*.35);
  if(storm&&sheltered&&distance(CAMP)>10&&!game.shelterSeen){game.shelterSeen=true;speak('arc06_cave',true,2);}
  if(distance(CAMP)<3.6&&game.reserve>0){const used=Math.min(game.reserve,dt*.30,100-walker.oxygen);game.reserve-=used;walker.addOxygen(used);}
  for(const d of Object.values(game.deployments))d.remaining=Math.max(0,d.remaining-dt);
  if(harvest){if(distance(harvest.node)>2.8||walker.motionSpeed>.4)cancelHarvest();else{harvest.elapsed+=dt;$('#harvest-fill').style.width=Math.min(100,harvest.elapsed/harvest.duration*100)+'%';if(harvest.elapsed>=harvest.duration)finish();}}
  if(valve){if(distance(valve.node)>3)takeValve();else $('#repair-needle').style.left=((Math.sin(sessionTime*1.6)+1)*50)+'%';}
  if(game.uploading){if(distance(CAMP)>3.8||game.reserve<=0){game.uploading=false;notify('上行暂停 · 留在营地并补足储备后 R 继续');}else{const step=Math.min(dt,UPLOAD_SECONDS-game.upload,game.reserve/(UPLOAD_OXYGEN/UPLOAD_SECONDS));game.reserve-=step*UPLOAD_OXYGEN/UPLOAD_SECONDS;game.upload+=step;if(game.upload>=UPLOAD_SECONDS){game.complete=true;progress.complete=true;game.uploading=false;game.completedAt=sessionTime;save();showEnding();return;}}}
  if(!game.complete&&sessionTime>=WINDOW_SECONDS){fail('中继窗口已关闭。回到最近通信阶段，再规划一次路线。');return;}
  if(walker.oxygen<23&&!lowWarned){lowWarned=true;speak('lowCamp',false,3);notify('氧气偏低 · T 转背罐，或回营 H 充装');}if(walker.oxygen>40)lowWarned=false;
  if(walker.oxygen<=0){const available=game.rescueReserve+game.reserve;if(available<20){fail('可用救援氧气已耗尽。');return;}const amount=Math.min(35,available),sealed=Math.min(amount,game.rescueReserve);game.rescueReserve-=sealed;game.reserve-=amount-sealed;consumeCargo(game.cargo*.5);game.rescues++;cancelHarvest();valve=null;game.harvesting=false;game.uploading=false;walker.respawn({x:CAMP.x,z:CAMP.z-2.5},amount);notify(`已用真实储备 ${Math.round(amount)} L 拖回营地 · 背罐散失一半，线索保留`);speak('death',false,3);save();}
  world.update(sessionTime,progress);world.field.update(sessionTime,game,progress);ambientSound.update?.(walker.actor.position);
  for(const n of nodes)if(n.species==='silver'&&n.object)n.object.scale.y=(n.object.userData.restScaleY||1)*(.8+(Math.sin(sessionTime*1.2+n.x)+1)*.18);
  if(saveClock>5){saveClock=0;save();}hudClock+=dt;if(hudClock<.15)return;hudClock=0;
  let best=2.7;nearest=null;for(const n of nodes){const d=distance(n);if(d<7)progress.discovered.add(n.id);if(d<best){best=d;nearest=n;}}
  $('#interact').hidden=!nearest;if(nearest){const n=nearest;let prompt=n.type==='camp'?game.cargo>0?'保持 E 插罐':'R 通信 / H 补给':n.type==='archive'?'E 看广告 · F 敲开记录':remaining(n)>0?`恢复 ${Math.ceil(remaining(n))}s`:n.type==='lung'?game.fed[n.id]?exhaling(n)?'排气 · 保持 E 收取 48 L':'吸气 · 等待舒展':'保持 E 喂 1 份露液':game.deployments[n.id]?`E 回收 · ${Math.ceil(game.deployments[n.id].remaining)}s 至满罐`:n.type==='wound'?'保持 E 回灌 · 1 露液 + 12 L':n.type==='listen'?'保持 E 观察 6 秒':n.species==='silver'&&!flowerOpen(n)?'闭合 · 等待展开':'E 连接 / 保持采集';$('#interact-label').textContent=n.name+' · '+prompt;}
  $('#strike-statue').hidden=!nearbyStatue();$('#cargo-value').textContent=Math.floor(game.cargo);$('#cargo-fill').style.width=game.cargo/CAPACITY*100+'%';$('#camp-reserve').textContent=Math.floor(game.reserve)+' L';$('#dew-value').textContent=game.dew+'/3';$('#camp-actions').hidden=distance(CAMP)>3.8;$('#camp-insert').disabled=game.cargo<=0;$('#camp-radio').textContent=game.uploading?'R · 暂停上行':'R · 地球通信';$('#scan-cooldown').textContent=sessionTime<scanReady?`${Math.ceil(scanReady-sessionTime)}s`:'扫描';
  $('#event-label').textContent=storm?sheltered?'锋面 / 掩护中':'锋面 / 额外耗氧':game.relayStage>0?'下一次孢子锋面':'未校准的生态周期';$('#event-time').textContent=game.relayStage>0||storm?Math.ceil(storm?150-phase:phase<120?120-phase:280-phase)+'s':'—';$('#event-banner').dataset.danger=String(storm&&!sheltered);
  $('#biome-label').textContent=Math.abs(walker.actor.position.x+18)<5&&walker.actor.position.z>34?'蓝脉洞窟':walker.actor.position.z>20?'共生林':'潮汐湖岸';
  let alt='';if(valve?.locks)alt=`提前收取 ${valve.locks*16} L`;else if(nearest&&game.deployments[nearest.id])alt=`撤回抽气器 · 已收 ${Math.floor(60*(1-game.deployments[nearest.id].remaining/18))} L`;else if(nearest?.type==='lung'&&game.fed[nearest.id]&&!remaining(nearest))alt='强抽 70 L · 此处休眠 180 秒';
  ui.update({chapter:CHAPTERS[Math.min(game.relayStage,4)],time:Math.max(0,WINDOW_SECONDS-sessionTime),observation:game.rootRestored?'旧泵停机，湖岸继续起伏':game.overdraws?'强抽后的肺囊正在休眠':game.relayStage>=2?'观察舒展与收缩，再决定取多少':'先观察，再接入',returnCost:distance(CAMP)*.3355,alternateText:alt,upload:game.upload/UPLOAD_SECONDS});updateMission();
 }
 addEventListener('keydown',e=>{if(!state.gameStarted||e.target.matches?.('input,textarea'))return;if(e.code==='KeyJ'&&!e.repeat){e.preventDefault();if(journal.open)resume();else if(!state.paused)openJournal();}if(state.paused||e.repeat)return;if(e.code==='KeyF')strike();if(e.code==='KeyQ')scan();if(e.code==='KeyT')emergency();if(e.code==='KeyH')refill();if(e.code==='KeyR')void earth();if(e.code==='KeyX')alternate();});
 addEventListener('keyup',e=>{if(e.code==='KeyE'&&harvest?.mode!=='force')cancelHarvest();});
 $('#interact').addEventListener('pointerdown',e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);interact();});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#interact').addEventListener(event,cancelHarvest);
 $('#camp-insert').addEventListener('pointerdown',e=>{if(state.paused)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);if(distance(CAMP)<=2.7&&game.cargo>0)begin(CAMP,2.4,'insert');});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#camp-insert').addEventListener(event,cancelHarvest);
 $('#tank-transfer').onclick=emergency;$('#camp-refill').onclick=refill;$('#camp-radio').onclick=()=>void earth();$('#scan-button').onclick=scan;$('#strike-statue').onclick=strike;addEventListener('pagehide',save);
 syncCargo();updateMission();return {update,interact,strike,target:()=>objective().node,progress,nodes,game,openJournal,scan,stopVoice,cancelHarvest,deposit,refill,earth,emergency,get sessionTime(){return sessionTime;},get repair(){return !!valve;},setMuted(value){muted=value;if(clip)clip.volume=value?0:.9;ambientSound.setDucked?.(!!clip&&!value);},start(){started=true;if(game.complete&&!game.exploring){showEnding();return;}speak('arc01_landing',true,2);notify('新版远征：采集 → 插罐 → 联系地球。15 分钟内完成求救上行。旧版存档保留。');if(!checkpoint)markCheckpoint();updateMission();}};
}
