/* Grupo Saúde — recebe as notificações no telemóvel/computador (Web Push). Não guarda páginas em cache:
   o programa continua sempre a ser carregado do servidor, com a versão mais recente. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch{d={body:e.data?e.data.text():''}}
 const title=String(d.title||'Grupo Saúde').slice(0,120),url=typeof d.url==='string'&&d.url.startsWith('/')?d.url:'/';
 e.waitUntil(self.registration.showNotification(title,{body:String(d.body||'').slice(0,300),icon:'/app-icon-192.png',badge:'/app-icon-192.png',tag:String(d.tag||'gs').slice(0,120),renotify:false,data:{url}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=e.notification.data?.url||'/';
 e.waitUntil((async()=>{const all=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const c of all){if(new URL(c.url).origin===self.location.origin){await c.focus();c.postMessage({type:'gs-open',url});return}}await self.clients.openWindow(url)})())});
