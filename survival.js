import {SAMPLE_NAMES,STORY_VERSION} from './story-data.js';
export const DRAIN={idle:.30,walk:.52,run:.86,jump:.18};
export const REGEN_SECONDS=75;
export const oxygenDrain=({moving=false,running=false,airborne=false})=>(moving?(running?DRAIN.run:DRAIN.walk):DRAIN.idle)+(airborne?DRAIN.jump:0);
export function createProgress(saved={}){
 const known=new Set(Object.keys(SAMPLE_NAMES));
 return {version:STORY_VERSION,samples:new Set((saved.samples||[]).filter(x=>known.has(x))),archives:new Set(saved.archives||[]),discovered:new Set(saved.discovered||[]),activated:new Set(saved.activated||[]),cooldowns:new Map(),complete:!!saved.complete};
}
export function serializeProgress(p){return {version:STORY_VERSION,samples:[...p.samples],archives:[...p.archives],discovered:[...p.discovered],activated:[...p.activated],complete:p.complete};}
export function resolveChoice(progress,node,choice,time){
 if(choice.joke)return {kind:'joke',message:choice.joke,oxygen:0};
 if(choice.safe)return {kind:'safe',message:'已避开刺激性孢子。继续找银露草。',oxygen:0};
 if(!choice.good)return {kind:'wrong',message:'过滤器受污染 · 氧气 −8%',oxygen:-8};
 if(node.type==='plant'){
  const left=Math.ceil((progress.cooldowns.get(node.id)||0)-time);
  if(left>0)return {kind:'cooldown',message:`这片植物正在恢复，${left} 秒后可再次采集。`,oxygen:0};
  progress.samples.add(node.species);progress.activated.add(node.id);progress.cooldowns.set(node.id,time+REGEN_SECONDS);
  return {kind:'oxygen',message:`${SAMPLE_NAMES[node.species]}已采集 · 氧气 +28%`,oxygen:28};
 }
 if(node.type==='archive'){
  const first=!progress.archives.has(node.id);progress.archives.add(node.id);
  return {kind:'clue',message:first?'线索已记入探索日志':'已重新查看这条线索',oxygen:0};
 }
 if(progress.samples.size<3)return {kind:'missing',message:`缺少：${Object.entries(SAMPLE_NAMES).filter(([id])=>!progress.samples.has(id)).map(([,name])=>name).join('、')}`,oxygen:0};
 progress.complete=true;progress.activated.add(node.id);
 return {kind:'complete',message:'制氧循环已建立 · 第一章完成',oxygen:100};
}
export function nearestSource(progress,nodes,position){
 return nodes.filter(n=>progress.activated.has(n.id)).sort((a,b)=>Math.hypot(a.x-position.x,a.z-position.z)-Math.hypot(b.x-position.x,b.z-position.z))[0]||null;
}
