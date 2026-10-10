'use strict';
const assert=require('node:assert/strict'),{createHash}=require('node:crypto'),{fixture}=require('./finance-fixture.cjs');
const Archive=require('../lib/document-archive-service'),Security=require('../lib/document-security-service');
const env={GS_FINANCE_ENVIRONMENT:'preview',VERCEL_ENV:'preview',GS_FINANCE_BLOB_TOKEN:'synthetic-primary',GS_FINANCE_BLOB_STORE_ID:'synthetic-primary-store',GS_FINANCE_BACKUP_BLOB_TOKEN:'synthetic-backup',GS_FINANCE_BACKUP_BLOB_STORE_ID:'synthetic-backup-store',GS_REAL_DOCUMENTS_ENABLED:'true',GS_DOCUMENT_SCAN_URL:'https://scanner.invalid',GS_DOCUMENT_SCAN_TOKEN:'synthetic',GS_DATABASE_RECOVERY_REFERENCE:'isolated-fixture',GS_GMAIL_TOKEN_KEYS:'synthetic-encrypted-config',GS_GMAIL_TOKEN_KEY_ID:'synthetic',GS_ONLINE_ARCHIVE_REMOVAL_ENABLED:'true'};
let passed=0;
async function test(name,mode){const f=fixture(),s=f.service,people=await s.people(),ceo=people[0],doctor=people[4];try{
 await Security.approve(s,ceo,{...Object.fromEntries(Security.requirements.map(k=>[k,true])),confirmed:true,validationReference:'Synthetic P0 retention fixture'},env);
 const bytes=Buffer.from('%PDF-1.4\nSYNTHETIC P0 '+name),inv=await s.uploadInvoice(doctor,{number:name,series:'A',invoiceDate:'2001-01-01',insertedDate:'2001-01-01',value:'40',document:{name:'synthetic.pdf',dataUrl:'data:application/pdf;base64,'+bytes.toString('base64')}}),doc=f.run('select * from documents where id=$1',[inv.documentId])[0],hash=createHash('sha256').update(bytes).digest('hex');
 await s.decideInvoice(ceo,{id:inv.id,revision:inv.revision,status:'Validada'});
 f.run("update documents set received_at='2001-01-01' where id=$1",[doc.id]);
 const plan={reviewedBy:ceo.id,reviewedAt:new Date().toISOString(),preparedBy:ceo.id,legalBasis:'Synthetic legal review',retainUntil:'2040-01-01',legalHold:false,backupStatus:'Archived',archiveReceipt:'synthetic-reviewed-receipt',contentHash:hash,backupHash:hash};
 if(mode==='legal-hold')plan.legalHold=true;
 if(mode==='no-receipt')delete plan.archiveReceipt;
 f.run('insert into finance_archive_plans(document_id,data,revision,updated_at,updated_by) values($1,$2,1,$3,$4)',[doc.id,JSON.stringify(plan),new Date().toISOString(),ceo.id]);
 if(mode!=='no-backup')f.run('insert into document_storage_backups(document_key,backup_key,content_hash,status,checked_at) values($1,$2,$3,$4,$5)',[doc.storage_key,'synthetic-recovery',hash,'Verificada',new Date().toISOString()]);
 s.backupStorage={get:async()=>{if(mode==='storage-failure')throw Error('synthetic storage unavailable');return{bytes:mode==='wrong-checksum'?Buffer.from('CORRUPTED'):bytes}}};
 const who=mode==='unauthorized'?doctor:ceo;
 let failure;try{await Archive.execute(s,who,{id:doc.id,revision:1,confirmed:true,reason:'Synthetic isolated test'},env);}catch(e){failure=e;}assert(failure,'Deletion must fail');const message=String(failure.message);if(['no-backup','wrong-checksum'].includes(mode))assert(/recuperável|verificado/i.test(message),message);if(mode==='storage-failure')assert(/storage unavailable/i.test(message),message);if(mode==='legal-hold')assert(/legal/i.test(message),message);if(mode==='no-receipt')assert(/arquivo|receção/i.test(message),message);
 assert.deepEqual((await f.storage.get(doc.storage_key)).bytes,bytes);
 assert.equal(f.run('select storage_key from documents where id=$1',[doc.id])[0].storage_key,doc.storage_key);
 assert.equal(f.run("select count(*) n from finance_events where action='ELIMINAR_APENAS_COPIA_OPERACIONAL'")[0].n,0);
 passed++;console.log('PASS P0 retention: '+name+'; original file and metadata preserved: '+message);
 }finally{f.close();}}
(async()=>{for(const mode of ['no-backup','wrong-checksum','storage-failure','legal-hold','no-receipt','unauthorized'])await test(mode,mode);console.log(JSON.stringify({passed,failed:0,scope:'Disposable SQL and private synthetic files; no production deletion'}))})().catch(e=>{console.error(e);process.exitCode=1});
