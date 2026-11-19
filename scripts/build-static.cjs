'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),output=path.join(root,'dist');
const assets=fs.readdirSync(root).filter(name=>(/\.(html|css|js)$/.test(name)||name==='official-logo-v4.svg')&&fs.statSync(path.join(root,name)).isFile());
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
// Velocidade: cada ficheiro JS/CSS fica com uma impressão digital do conteúdo (?v=…). O navegador pode guardá-lo
// em cache sem voltar a perguntar; quando o ficheiro muda, a impressão muda e o novo é descarregado.
const crypto=require('node:crypto'),hashes={};
const fingerprint=name=>hashes[name]||(hashes[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(output,name))).digest('hex').slice(0,10));
let tagged=0;
for(const name of fs.readdirSync(output).filter(n=>n.endsWith('.html'))){
 const file=path.join(output,name),html=fs.readFileSync(file,'utf8');
 const next=html.replace(/((?:src|href)=")([^"#?:]+\.(?:js|css))(?:\?[^"]*)?"/g,(m,pre,asset)=>{if(!fs.existsSync(path.join(output,asset)))return m;tagged++;return pre+asset+'?v='+fingerprint(asset)+'"'});
 if(next!==html)fs.writeFileSync(file,next);
}
console.log(`PASS static build: ${assets.length} assets retained in dist; ${tagged} script/style references fingerprinted; backend, secrets and documents excluded`);
