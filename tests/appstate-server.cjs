'use strict';
/* Servidor de teste: serve a aplicação construída (dist) e simula sessão + estado partilhado com o serviço real. */
const http=require('http'),fs=require('fs'),path=require('path'),St=require('../lib/app-state-service'),fake=require('./appstate-fake-db.cjs');
const ROOT=path.join(__dirname,'..','dist'),PORT=Number(process.env.PORT||8790);
const people=[{id:'u-ceo',name:'SYN CEO',role:'CEO',clinics:['algarfisio'],active:true},{id:'u-adm',name:'SYN Administrativa',role:'ADMINISTRATIVA',clinics:['algarfisio'],active:true},{id:'u-tec',name:'SYN Técnico',role:'TECNICO/A',clinics:['algarfisio'],active:true},{id:'u-med',name:'SYN Médico',role:'Médico/a',clinics:['algarfisio'],active:true}];
const db=fake({clinics:[{id:'algarfisio',name:'AlgarFisio',active:true}],people,employees:[]});
const actor=req=>{const m=/gs_test_user=([a-z-]+)/.exec(req.headers.cookie||'');const p=m&&people.find(x=>x.id===m[1]);return p?{...p,permissions:{}}:null};
const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
http.createServer(async(req,res)=>{const u=new URL(req.url,'http://x');const send=(code,obj)=>{res.writeHead(code,{'content-type':'application/json'});res.end(JSON.stringify(obj))};
 try{if(u.pathname==='/api/auth'){const a=actor(req);return a?send(200,{user:{id:a.id,name:a.name,role:a.role,clinics:a.clinics}}):send(401,{error:'Sem sessão'})}
  if(u.pathname==='/api/v4-extensions'&&u.searchParams.get('resource')==='appstate'){const a=actor(req);if(!a)return send(401,{error:'Sem sessão'});if(req.method==='GET')return send(200,await St.read(db.s,a,Number(u.searchParams.get('since'))||0));let body='';for await(const c of req)body+=c;return send(200,await St.write(db.s,a,JSON.parse(body||'{}')))}
  if(u.pathname==='/__state')return send(200,Object.fromEntries(db.settings));
  let f=path.join(ROOT,decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!f.startsWith(ROOT)||!fs.existsSync(f))return send(404,{error:'not found'});res.writeHead(200,{'content-type':type[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)}catch(e){send(e.status||500,{error:e.message})}
}).listen(PORT,'127.0.0.1',()=>console.log('appstate test server on',PORT));
