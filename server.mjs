import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {getEarthNews,getEarthAudio} from './earth-news.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.gltf':'model/gltf+json','.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg','.hdr':'application/octet-stream','.bin':'application/octet-stream','.md':'text/plain; charset=utf-8'};
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(u.pathname);
 if(pathname.startsWith('/api/')){
  const origin=req.headers.origin,site=req.headers['sec-fetch-site'];if(site==='cross-site'||origin&&!new Set([`http://127.0.0.1:${port}`,`http://localhost:${port}`]).has(origin))return json(res,403,{error:'Local game requests only'});
  if(pathname==='/api/health')return json(res,200,{version:'camp-20261016'});
  if(pathname==='/api/earth-news'&&req.method==='GET'){try{return json(res,200,await getEarthNews());}catch{return json(res,503,{error:'News unavailable'});}}
  if(pathname==='/api/earth-audio'&&req.method==='POST'){try{return json(res,200,{audioUrl:await getEarthAudio(u.searchParams.get('id')||'')});}catch{return json(res,503,{error:'English speech unavailable'});}}
  return json(res,404,{error:'Unknown route'});
 }
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)||pathname.startsWith('/work/')||pathname.startsWith('/tools/')||pathname.startsWith('/backups/')){res.writeHead(403);return res.end();}
 fs.stat(file,(e,s)=>{if(e||!s.isFile()){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':s.size,'Cache-Control':'no-cache'});if(req.method==='HEAD')return res.end();const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);});
 }catch{if(!res.headersSent)json(res,400,{error:'Bad request'});else res.end();}}).listen(port,'127.0.0.1',()=>console.log(`Willow Lagoon: http://127.0.0.1:${port}`));
