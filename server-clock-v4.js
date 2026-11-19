/* Hora oficial: as regras com prazo (faltas até às 14h/20h, seguros, marcações por hora) usam a hora do servidor,
   não a do aparelho. Mede a diferença uma vez ao abrir (cabeçalho Date da própria aplicação) e corrige se passar de 2 minutos.
   Em localhost/ficheiro o servidor é a própria máquina, por isso não há correção. */
(function(root){
  const local=()=>{try{return root.location.protocol==='file:'||/^(localhost|127\.0\.0\.1|\[::1\])$/.test(root.location.hostname)}catch{return true}};
  const clock={offset:0,synced:false,now(){return Date.now()+clock.offset},iso(){return new Date(clock.now()).toISOString()},
    apply(serverMs,sentAt,receivedAt){if(!Number.isFinite(serverMs))return false;const mid=(sentAt+receivedAt)/2,skew=serverMs-mid;clock.offset=Math.abs(skew)>120000?Math.round(skew):0;clock.synced=true;return true},
    async sync(fetcher=root.fetch){if(local()||!fetcher)return false;try{const t0=Date.now(),r=await fetcher('index.html?clock='+t0,{method:'HEAD',cache:'no-store'}),t1=Date.now();return clock.apply(Date.parse(r.headers.get('date')||''),t0,t1)}catch{return false}}};
  root.GSClock=clock;if(typeof module!=='undefined')module.exports=clock;
  if(root.document)clock.sync();
})(typeof window!=='undefined'?window:globalThis);
