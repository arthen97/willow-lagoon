import fs from 'node:fs/promises';
import {getEarthNews,getEarthAudio} from '../earth-news.mjs';
await fs.mkdir('data',{recursive:true});
try{
 const data=await getEarthNews();let audioUrl=null;
 try{audioUrl=await getEarthAudio(data.id);}catch{console.log('English bulletin unavailable; retaining sourced text headlines.');}
 await fs.writeFile('data/earth-news.json',JSON.stringify({...data,audioUrl},null,2));console.log('Earth relay updated:',data.fetchedAt,data.articles.length,'headlines; audio:',!!audioUrl);
}catch{
 const old=JSON.parse(await fs.readFile('data/earth-news.json','utf8'));old.stale=true;await fs.writeFile('data/earth-news.json',JSON.stringify(old,null,2));console.log('Sources unavailable; archived bulletin explicitly marked stale.');
}
