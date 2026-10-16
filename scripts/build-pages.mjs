import './build-opening.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {transform} from 'esbuild';
const root=process.cwd(),out=path.join(root,'dist');await fs.mkdir(out,{recursive:true});
for(const name of await fs.readdir(root)){
 if(name.endsWith('.js')){const source=await fs.readFile(name,'utf8');const result=await transform(source,{loader:'js',target:'es2022',format:'esm',sourcefile:name});await fs.writeFile(path.join(out,name),result.code);}
 else if(/\.(css|html)$/.test(name)||name==='ASSET_CREDITS.md')await fs.copyFile(name,path.join(out,name));
}
for(const name of ['assets','data'])await fs.cp(name,path.join(out,name),{recursive:true,filter:p=>!(/\.(blend\d*|py|log)$/.test(p))});
await fs.mkdir(path.join(out,'node_modules'),{recursive:true});await fs.cp('node_modules/three',path.join(out,'node_modules/three'),{recursive:true});
let html=await fs.readFile(path.join(out,'index.html'),'utf8');html=html.replace('<script type="importmap">','<script>window.LAGOON_STATIC_SITE=true;</script><script type="importmap">');await fs.writeFile(path.join(out,'index.html'),html);await fs.writeFile(path.join(out,'.nojekyll'),'');console.log('Built GitHub Pages game.');
