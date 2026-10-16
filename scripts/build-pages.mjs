import './build-opening.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),out=path.join(root,'dist');await fs.mkdir(out,{recursive:true});
for(const name of await fs.readdir(root))if(/\.(js|css|html)$/.test(name)||['ASSET_CREDITS.md'].includes(name))await fs.copyFile(name,path.join(out,name));
for(const name of ['assets','data'])await fs.cp(name,path.join(out,name),{recursive:true,filter:p=>!(/\.(blend\d*|py|log)$/.test(p))});
await fs.mkdir(path.join(out,'node_modules'),{recursive:true});await fs.cp('node_modules/three',path.join(out,'node_modules/three'),{recursive:true});
let html=await fs.readFile(path.join(out,'index.html'),'utf8');html=html.replace('<script type="importmap">','<script>window.LAGOON_STATIC_SITE=true;</script><script type="importmap">');await fs.writeFile(path.join(out,'index.html'),html);await fs.writeFile(path.join(out,'.nojekyll'),'');console.log('Built GitHub Pages game.');
