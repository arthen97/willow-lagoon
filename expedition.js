import {earthNews,earthAudio} from './earth-client.js';
import {SAMPLE_NAMES,VOICE_LINES} from './story-data.js';
import {createProgress,serializeProgress} from './survival.js';
import {CAMP} from './field-world.js';
const $=s=>document.querySelector(s),STORE='willow-camp-expedition-v3',CAPACITY=120;
export function createExpedition({walker,state,world,notify,openDialog,resume,ambientSound}){
 let saved={};try{saved=JSON.parse(localStorage.getItem(STORE)||'{}');}catch{}
 const progress=createProgress(saved),nodes=world.nodes;
 const game={cargo:saved.cargo||0,reserve:saved.reserve??25,delivered:saved.delivered||0,dew:saved.dew||0,deployments:saved.deployments||{},salvaged:new Set(saved.salvaged||[]),harvesting:false,relayStage:saved.relayStage||0,cargoKinds:saved.cargoKinds||[],deliveredKinds:saved.deliveredKinds||[],contactDelivery:saved.contactDelivery??-1};
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
 function begin(node,duration,kind){harvest={node,duration,elapsed:0,kind};game.harvesting=true;$('#harvest-fill').style.width='0%';action(kind==='insert'?'保持 E · 插入采集罐并锁定接口':kind==='dew'?'保持 E · 取下完整露囊':kind==='feed'?'保持 E · 接入共生肺囊':'保持 E · 接入收集装置',kind==='insert'?'插入 → 密封 → 释放氧气 · 松开即中断':'蓝息质正在装入采集罐 · 回营地释放氧气，或 T 应急转气');}
 function addCargo(amount,node){const actual=Math.min(amount,CAPACITY-game.cargo);game.cargo+=actual;const kind=node.type==='siphon'?'cave':node.type==='lung'?'lung':node.type==='vent'?'vent':node.species||'salvage';if(!game.cargoKinds.includes(kind))game.cargoKinds.push(kind);progress.activated.add(node.id);if(node.species&&node.species!=='red')progress.samples.add(node.species);notify(`${node.type==='salvage'?'应急氧气已回收':'蓝息质已装罐'} · 可释放 +${actual} L 氧气 · 采集罐 ${Math.round(game.cargo)}/${CAPACITY} L`);save();updateMission();}
 const flowerOpen=n=>(Math.sin(sessionTime*1.2+n.x)+1)/2>.25;
 function interact(){
  if(state.paused||!nearest)return;const n=nearest;progress.discovered.add(n.id);
  if(n.type==='camp'){if(game.cargo>0)begin(n,2.4,'insert');else notify(game.delivered>=28?'采集罐已回收 · 按 R 接通地球领取线索':'先采集营地旁的银白蓝息质，再回来插入采集罐。');return;}
  if(n.type==='archive'){progress.archives.add(n.id);save();speak(n.portrait);notify(n.clue);return;}
  if(n.type==='relay'){notify('旧终端已断电。先把氧气罐送回零号营地，营地天线才能连接地球。');return;}
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
  if(kind==='insert'){deposit();cancelHarvest();return;}
  if(kind==='dew'){game.dew++;progress.samples.add('dew');progress.cooldowns.set(n.id,sessionTime+45);notify(`营养露囊 +1 · ${game.dew}/3 · 用于喂养共生肺囊`);speak('dewCollect',true);}
  else if(kind==='feed'){game.dew--;addCargo(48,n);progress.cooldowns.set(n.id,sessionTime+80);speak('symbiosis',true);}
  else if(kind==='salvage'){game.salvaged.add(n.id);addCargo(24,n);speak('salvage',true);}
  else{addCargo(28,n);progress.cooldowns.set(n.id,sessionTime+55);speak('flower',true);}
  cancelHarvest();save();updateMission();
 }
 function deposit(){if(!game.cargo){notify('营地无自动制氧。出发采集，再把满罐带回来。H 补给宇航服，R 接通地球。');return;}const amount=game.cargo;game.reserve+=amount;game.delivered+=amount;game.deliveredKinds=[...new Set([...game.deliveredKinds,...game.cargoKinds])];game.cargoKinds=[];game.cargo=0;game.insertedAt=sessionTime;progress.activated.add('camp');save();notify(`采集罐已锁定 · 释放 ${Math.round(amount)} L 氧气 · 按 R 接通地球，获取任务`);speak('deposit',true);updateMission();}
 function refill(){if(distance(CAMP)>3.8){notify('回到零号营地后才能使用充装台');return;}const amount=Math.min(35,game.reserve,100-walker.oxygen);if(amount<1){notify(game.reserve<1?'营地氧气储备已空':'宇航服已充满');return;}game.reserve-=amount;walker.addOxygen(amount);save();notify(`宇航服补给 +${Math.round(amount)}% · 消耗营地 ${Math.round(amount)} L`);}
 function emergency(){if(state.paused)return;const amount=Math.min(25,game.cargo,100-walker.oxygen);if(amount<1){notify('背罐没有可用氧气，或宇航服已满');return;}game.cargo-=amount;if(game.cargo<=0)game.cargoKinds=[];walker.addOxygen(amount);save();notify(`应急转气 +${Math.round(amount)}% · 可带回营地的氧气减少`);}
 const dispatches=[
  {title:'01 / 第一声回音',message:'这里是地球任务中心。我们收到你的氧气回收数据了。你采到的物质暂命名为「蓝息质」：一种能在多孔组织内捕获氧气的外星生物凝胶。采集罐储存它，营地装置负责释放氧气。',clue:'下一步：前往北侧蓝脉洞窟。在蓝色菌床按 E 放下收集器，18 秒后收回，再带到营地插罐。洞穴能躲避孢子风暴。',node:'cave-siphon',kind:'cave'},
  {title:'02 / 更稳定的呼吸',message:'洞穴样本收到。低光菌床可以蓄氧，但我们需要找到能反复补充它的生态循环。东侧露囊和骨白色肺囊之间存在共生关系。',clue:'下一步：到东侧阴影露囊灌木保持 E，取一份营养露液。带给共生肺囊，保持 E 喂养，收集 48 L 氧气，再回营地插罐。',node:'dew-a',kind:'lung'},
  {title:'03 / 潮汐中的信号',message:'共生反应确认。你已经找到一种可持续的氧气来源。我们在潮汐气孔附近检测到另一段低频信号，需要高压蓝息质帮助校准接收器。',clue:'下一步：去营地东侧潮汐气孔。按 E 接管，在压力表浅绿色区域再按 E，成功密封三次。带回 32 L 氧气后重新通话。',node:'vent-a',kind:'vent'},
  {title:'04 / 保持联络',message:'三类回收数据均已确认。我们已记录你的营地坐标，救援航线仍需计算。你建立的集氧路线将支持接下来的等待。保持储备，活着等下一次回音。',clue:'本章任务完成。可以继续采集、探索遗迹、补充宇航服，并回营地收听更新的地球新闻。',node:null,kind:null}
 ];
 function dispatchIndex(){return game.relayStage===0?0:game.relayStage<4&&game.deliveredKinds.includes(dispatches[game.relayStage-1].kind)?game.relayStage:Math.min(3,game.relayStage-1);}
 async function earth(){
  if(state.paused||radioBusy)return;if(distance(CAMP)>3.8){notify('回到营地，使用固定通信天线');return;}if(game.delivered<28){notify('先把一份蓝息质带回营地，保持 E 插入采集罐（28 L 即可）');return;}
  const charge=game.contactDelivery!==game.delivered;if(charge&&game.reserve<10){notify('营地储备不足 10 L · 再回收一罐蓝息质才能通信');return;}
  if(charge){game.reserve-=10;game.contactDelivery=game.delivered;save();}
  radioBusy=true;openDialog(radio);$('#earth-bulletin').open=false;
  const idx=dispatchIndex(),brief=dispatches[idx];
  $('#earth-task-title').textContent=brief.title;$('#earth-task-message').textContent=brief.message;$('#earth-task-clue').textContent=brief.clue;
  $('#earth-accept').textContent=idx===3?'收到，继续生存 →':'收到，标记任务地点 →';
  $('#earth-accept').onclick=()=>{game.relayStage=Math.max(game.relayStage,idx+1);if(brief.node)progress.discovered.add(brief.node);if(idx===1)progress.discovered.add('lung-a');progress.complete=game.relayStage>=4;save();updateMission();stopVoice();resume();notify(idx===3?'第一章完成 · 保持氧气储备':'地球任务已接受 · 跟随金色目标标记');};
  $('#earth-status').textContent='正在接收现实世界新闻…';$('#earth-news').replaceChildren();$('#earth-play').disabled=true;$('#earth-overview').textContent='任务通信已经接通。新闻频道独立接收中。';
  try{const data=await earthNews();
   $('#earth-status').textContent=`${data.stale?'存档信号':'新闻频道在线'} · ${new Date(data.fetchedAt).toLocaleString('zh-CN')} · ${data.source}`;
   $('#earth-overview').textContent='以下是现实世界的新闻来源，与 2486 年虚构任务剧情无关。';
   for(const item of data.articles){const article=document.createElement('article'),a=document.createElement('a'),meta=document.createElement('small');a.textContent=item.title;a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';meta.textContent=`${item.source} · ${item.publishedAt?new Date(item.publishedAt).toLocaleString('zh-CN'):'来源未提供时间'}`;article.append(meta,a);$('#earth-news').append(article);}
   $('#earth-play').disabled=false;$('#earth-play').textContent='▶ 收听英语新闻';$('#earth-play').onclick=()=>playNews(data);
  }catch{$('#earth-status').textContent='新闻信号暂不可用 · 任务通信不受影响';$('#earth-overview').textContent='可以直接接受任务并继续探索，稍后重新连接新闻频道。';}
  finally{radioBusy=false;}
 }
 async function playNews(data){stopVoice();if(muted)return;$('#earth-play').disabled=true;$('#earth-play').textContent='正在生成英语广播…';let url;try{url=await earthAudio(data);}catch{$('#earth-play').textContent='英语音频暂不可用 · 请阅读原文';$('#earth-play').disabled=false;return;}$('#earth-play').disabled=false;$('#earth-play').textContent='▶ 重播英语新闻广播';if(!radio.open||muted)return;const audio=new Audio(url);clip=audio;audio.volume=.9;ambientSound.setDucked?.(true);audio.addEventListener('ended',stopVoice,{once:true});audio.play().catch(()=>{$('#earth-status').textContent+=' · 英语广播音频暂不可用，可阅读原文';ambientSound.setDucked?.(false);});}
 $('#close-earth').onclick=()=>{stopVoice();resume();};radio.addEventListener('cancel',e=>{e.preventDefault();stopVoice();resume();});
 function openJournal(){openDialog(journal);$('#journal-entries').replaceChildren();const notes=[`带回营地 ${Math.round(game.delivered)} L · 储备 ${Math.round(game.reserve)} L。蓝息质是集氧凝胶；采集罐储存凝胶和氧气。T 应急转气，回营地保持 E 插罐释放、H 补给、R 领取地球任务。`,'银色呼吸花：观察开合，展开后保持 E 连接收集管。55 秒恢复。','透明露囊：保持 E 采集营养液；喂给骨白色肺囊，换取 48 L 氧气。','洞内蓝脉菌床：按 E 放置抽气器，18 秒后回来收取 40 L。装置只有一台。','潮汐气孔：在压力表绿色区域按 E，完成三次密封，取得 32 L。','坠毁货舱：回收一只应急氧气罐，24 L，仅可取一次。','新闻终端接收现实世界新闻。TRAPPIST-1 e 上的生态、遗迹、未来名人留言均属虚构。'];for(const text of notes){const p=document.createElement('p');p.textContent=text;$('#journal-entries').append(p);}for(const n of nodes.filter(n=>progress.archives.has(n.id))){const h=document.createElement('h3'),p=document.createElement('p');h.textContent=n.title;p.textContent=n.clue;$('#journal-entries').append(h,p);}}
 $('#journal-open').onclick=openJournal;$('#close-journal').onclick=()=>resume();journal.addEventListener('cancel',e=>{e.preventDefault();resume();});
 addEventListener('keydown',e=>{if(!state.gameStarted||e.target.matches?.('input,textarea'))return;if(e.code==='KeyJ'&&!e.repeat){e.preventDefault();if(journal.open)resume();else if(!state.paused)openJournal();}if(state.paused||e.repeat)return;if(e.code==='KeyQ')scan();if(e.code==='KeyT')emergency();if(e.code==='KeyH')refill();if(e.code==='KeyR')void earth();});
 addEventListener('keyup',e=>{if(e.code==='KeyE')cancelHarvest();});
 $('#interact').addEventListener('pointerdown',e=>{e.preventDefault();$('#interact').setPointerCapture(e.pointerId);interact();});for(const name of ['pointerup','pointercancel','lostpointercapture'])$('#interact').addEventListener(name,cancelHarvest);
 $('#camp-insert').addEventListener('pointerdown',e=>{if(state.paused)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);if(distance(CAMP)<=2.7&&game.cargo>0)begin(CAMP,2.4,'insert');else notify('带着蓝息质采集罐，靠近营地接口再保持 E');});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#camp-insert').addEventListener(event,cancelHarvest);
 $('#tank-transfer').onclick=emergency;$('#camp-refill').onclick=refill;$('#camp-radio').onclick=()=>void earth();$('#scan-button').onclick=scan;
 function scan(){if(state.paused)return;if(sessionTime<scanReady){notify(`扫描冷却 · ${Math.ceil(scanReady-sessionTime)} 秒`);return;}scanReady=sessionTime+12;world.scanUntil=sessionTime+6;let count=0;for(const n of nodes)if(distance(n)<22){if(!progress.discovered.has(n.id))count++;progress.discovered.add(n.id);}notify(`发现 ${count} 处新生态信号 · 扫描不耗氧`);save();}
 function nextObjective(){
  const stage=game.relayStage,required=stage>0&&stage<4?dispatches[stage-1].kind:null;
  if(walker.oxygen<25&&game.reserve>0)return {title:'氧气偏低 · 返回营地补给',detail:'跟随营地标记，靠近后按 H 充装宇航服；采集罐有氧可按 T 应急。',node:CAMP};
  if(game.cargo>0&&(stage===0||game.cargo>=80||game.cargoKinds.includes(required)))return {title:'02 / 回营地，插入采集罐',detail:'蓝息质已装罐。跟随营地标记，靠近回收装置保持 E，直到插入完成。',node:CAMP};
  if(game.delivered>=28&&(stage===0||required&&game.deliveredKinds.includes(required)))return {title:'03 / 接通地球，领取下一条线索',detail:'回收完成。回营地按 R，阅读地球任务并点击「收到」标记下一目标。',node:CAMP};
  const otherPump=Object.keys(game.deployments).find(id=>id!=='cave-siphon');if(stage===1&&otherPump)return {title:'先收回已放置的集氧装置',detail:'你只有一台收集器。跟随标记，等待集氧结束后按 E 收回，再前往洞窟。',node:nodes.find(n=>n.id===otherPump)};
  if(stage===1){const d=game.deployments['cave-siphon'];return {title:d?d.remaining>0?'等待菌床集氧，再收回装置':'收回洞穴集氧罐':'前往蓝脉洞窟，采集蓝息质',detail:d?d.remaining>0?`收集器工作中 · 剩余 ${Math.ceil(d.remaining)} 秒。收回后回营地插罐。`:'靠近装置按 E 收取，再返回营地。':'跟随洞窟标记。在蓝色菌床按 E 放置装置，18 秒后收取。',node:nodes.find(n=>n.id==='cave-siphon')};}
  if(stage===2)return {title:game.dew?'喂养肺囊，收集蓝息质':'采集透明露囊，启动共生',detail:game.dew?'靠近骨白肺囊保持 E，换取 48 L 氧气，然后回营地插罐。':'到标记灌木保持 E，采集营养露液。它是肺囊的食物。',node:nodes.find(n=>n.id===(game.dew?'lung-a':'dew-a'))};
  if(stage===3)return {title:'密封潮汐气孔，回收高压样本',detail:'按 E 接管，指针进入浅绿色区再按 E。成功三次后回营地插罐。',node:nodes.find(n=>n.id==='vent-a')};
  return {title:stage>=4?'保持呼吸，等待地球回音':'01 / 采集第一份蓝息质',detail:stage>=4?'继续采集与回收，维持营地储备。R 收听地球新闻，J 查看采集笔记。':'跟随标记找到银白植物，展开时保持 E。蓝息质会装入采集罐。',node:nodes.find(n=>n.id==='silver-a')};
 }
 function updateMission(){const o=nextObjective();$('#mission-title').textContent=o.title;$('#mission-detail').textContent=o.detail;$('#sample-count').textContent=`${Math.floor(game.delivered)} L`;}
 function target(){return nextObjective().node||CAMP;}
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
  if(walker.oxygen<=0){cancelHarvest();valve=null;$('#field-action').hidden=true;const reserve=Math.min(40,game.reserve);game.reserve-=reserve;game.cargo=Math.floor(game.cargo*.5);if(game.cargo<=0)game.cargoKinds=[];walker.respawn({x:CAMP.x,z:CAMP.z-2.5},Math.max(30,reserve));notify('应急拖回营地 · 散失一半背罐气体，线索保留');speak('death');save();}
  world.update(sessionTime,progress);world.field.update(sessionTime,game);ambientSound.update?.(walker.actor.position);
  for(const n of nodes)if(n.species==='silver'&&n.object)n.object.scale.y=(n.object.userData.restScaleY||1)*(.8+(Math.sin(sessionTime*1.2+n.x)+1)*.18);
  if(saveClock>10){saveClock=0;save();}
  hudClock+=dt;if(hudClock<.15)return;hudClock=0;
  let best=2.7;nearest=null;for(const n of nodes){const d=distance(n);if(d<7)progress.discovered.add(n.id);if(d<best){best=d;nearest=n;}}
  $('#interact').hidden=!nearest;if(nearest){const n=nearest;let prompt=n.type==='camp'?game.cargo>0?'保持 E · 插入蓝息质采集罐':'R · 接通地球 / H · 补给':n.type==='archive'?'播放留言':n.type==='lung'?game.dew?'保持 E · 喂养取气':'需要营养露囊':n.type==='siphon'||n.species==='moss'?game.deployments[n.id]?game.deployments[n.id].remaining>0?`抽气中 ${Math.ceil(game.deployments[n.id].remaining)}s`:'收回满罐':'放置抽气器':n.type==='vent'?'按 E · 密封取气':n.species==='silver'?flowerOpen(n)?'展开 · 保持 E 采集蓝息质':'闭合 · 等待展开':'保持 E 收集';$('#interact-label').textContent=n.name+' · '+prompt;}
  $('#cargo-value').textContent=Math.floor(game.cargo);$('#cargo-fill').style.width=game.cargo/CAPACITY*100+'%';$('#camp-reserve').textContent=Math.floor(game.reserve)+' L';$('#dew-value').textContent=game.dew+'/3';$('#camp-actions').hidden=distance(CAMP)>3.8;$('#camp-insert').disabled=game.cargo<=0;$('#camp-radio').textContent=game.delivered>=28?'R · 地球任务通信':'先插入第一罐蓝息质';$('#scan-cooldown').textContent=sessionTime<scanReady?`${Math.ceil(scanReady-sessionTime)}s`:'扫描';
  $('#event-label').textContent=storm?sheltered?'洞窟 / 营地掩护':'孢子锋面 · 额外耗氧':'下一次孢子锋面';$('#event-time').textContent=Math.ceil(storm?127-phase:phase<=100?100-phase:245-phase)+'s';$('#event-banner').dataset.danger=String(storm&&!sheltered);
  $('#biome-label').textContent=Math.abs(walker.actor.position.x+18)<5&&walker.actor.position.z>34?'蓝脉洞窟':walker.actor.position.z>20?'骨帆共生林':'坠落湾 · 零号营地';updateMission();
 }
 addEventListener('pagehide',save);
 updateMission();return {update,interact,target,progress,nodes,game,openJournal,scan,stopVoice,cancelHarvest,deposit,refill,earth,emergency,get sessionTime(){return sessionTime;},get repair(){return !!valve;},setMuted(value){muted=value;if(clip)clip.volume=value?0:.9;ambientSound.setDucked?.(!!clip&&!value);},start(){started=true;notify(game.relayStage?'远征记录已恢复 · 按当前任务继续行动':'第一步：跟随金色标记，靠近银白植物并保持 E 采集蓝息质。');updateMission();}};
}
