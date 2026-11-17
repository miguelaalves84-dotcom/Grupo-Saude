const assert=require('assert');const C=require('../server-clock-v4.js');
// Aparelho 3 horas atrasado: corrige para a hora do servidor
assert.ok(C.apply(1_000_000_000_000+3*3600e3,1_000_000_000_000,1_000_000_000_000));assert.strictEqual(C.offset,3*3600e3);
// Diferença pequena (até 2 minutos) é ignorada
C.apply(1_000_000_060_000,1_000_000_000_000,1_000_000_000_000);assert.strictEqual(C.offset,0);
// Cabeçalho inválido não altera nada
C.offset=5;assert.strictEqual(C.apply(NaN,0,0),false);assert.strictEqual(C.offset,5);C.offset=0;
// Sem rede ou em localhost: sem correção
(async()=>{assert.strictEqual(await C.sync(async()=>{throw new Error('offline')}),false);
 globalThis.GSClock=C;C.offset=24*3600e3;const O=require('../operation-core-v4.js');const real=new Date(Date.now()+24*3600e3).toLocaleDateString('en-CA',{timeZone:'Europe/Lisbon'});assert.strictEqual(O.today(),real,'today() follows server clock');C.offset=0;
 console.log('server clock: 5 checks passed')})().catch(e=>{console.error(e);process.exit(1)});
// RGPD 90 dias
{const O=require('../operation-core-v4.js');const s={days:{a:{date:'2026-01-01',clinic:'x',workflowRows:[{id:1,type:'insurance',patientRef:'123',name:'Ana',phone:'910',total:2,billed:2,history:[{name:'Ana'}]},{id:2,type:'insurance',patientRef:'124',name:'Rui',total:2,billed:1}]},b:{date:'2026-11-10',clinic:'x',workflowRows:[{id:3,done:true,name:'Eva',patientRef:'9'}]}}};
const n=O.anonymizeOld(s,'2026-11-17T10:00:00Z');assert.strictEqual(n,1);const r=s.days.a.workflowRows;assert.ok(!r[0].name&&!r[0].phone&&r[0].patientRef==='ANON'&&!r[0].history[0].name&&r[0].billed===2,'closed old row keeps only numbers');assert.strictEqual(r[1].name,'Rui','pending row kept');assert.strictEqual(s.days.b.workflowRows[0].name,'Eva','recent row kept');assert.strictEqual(O.anonymizeOld(s,'2026-11-17T10:00:00Z'),0,'idempotent');console.log('retention 90 days: 4 checks passed')}
