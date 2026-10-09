const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');let checked=0;
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(item.name==='.git'||item.name==='node_modules')continue;const f=path.join(dir,item.name);if(item.isDirectory())walk(f);else if(/\.(js|cjs)$/.test(item.name)){const source=fs.readFileSync(f,'utf8');if(/^export /m.test(source)){const result=require('node:child_process').spawnSync(process.execPath,['--input-type=module','--check'],{input:source,encoding:'utf8'});if(result.status!==0)throw Error(result.stderr)}else new vm.Script(source,{filename:f});checked++}}}
walk(root);console.log(`PASS syntax: ${checked} JavaScript files`);
