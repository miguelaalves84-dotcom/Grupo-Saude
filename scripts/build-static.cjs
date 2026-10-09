'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),output=path.join(root,'dist');
const assets=fs.readdirSync(root).filter(name=>/\.(html|css|js)$/.test(name)&&fs.statSync(path.join(root,name)).isFile());
// Validate before replacing only the generated output; never touch data or source.
for(const name of assets){
 if(!name.endsWith('.html'))continue;
 for(const match of fs.readFileSync(path.join(root,name),'utf8').matchAll(/(?:src|href)="([^"#]+)"/g)){
  const asset=match[1].split('?')[0];
  if(!/^(https?:|data:|mailto:)/.test(asset)&&!fs.existsSync(path.resolve(root,asset)))throw Error(`${name}: missing ${asset}`);
 }
}
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output);
for(const name of [...assets,'_headers'].filter(name=>fs.existsSync(path.join(root,name))))fs.copyFileSync(path.join(root,name),path.join(output,name));
console.log(`PASS static build: ${assets.length} assets retained in dist; backend, secrets and documents excluded`);
