import {build} from 'esbuild';
await build({entryPoints:['ui/opening.jsx'],bundle:true,format:'esm',minify:true,jsx:'automatic',outfile:'assets/ui/opening-ui.js',define:{'process.env.NODE_ENV':'"production"'}});
