export async function earthNews(){
 const staticSite=!!window.LAGOON_STATIC_SITE;
 const response=await fetch(staticSite?'./data/earth-news.json?ts='+Date.now():'/api/earth-news',{signal:AbortSignal.timeout(40000)});
 const data=await response.json();if(!response.ok||!data.articles?.length)throw new Error('News unavailable');
 if(staticSite){data.stale=!!data.stale||Date.now()-Date.parse(data.fetchedAt)>8*3600000;data.source+=' · 定时地球中继';}
 return data;
}
export async function earthAudio(data){
 if(window.LAGOON_STATIC_SITE){if(!data.audioUrl)throw new Error('Audio unavailable');return data.audioUrl;}
 const r=await fetch('/api/earth-audio?id='+data.id,{method:'POST'}),d=await r.json();if(!r.ok||!d.audioUrl)throw new Error('Audio unavailable');return d.audioUrl;
}
