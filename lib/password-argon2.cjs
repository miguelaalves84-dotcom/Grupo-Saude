'use strict';
/* Better Auth password adapter. Node's Argon2id implementation; no fallback cipher/hash. */
const {argon2,randomBytes,timingSafeEqual}=require('node:crypto'),{promisify}=require('node:util');
let active=0;const rawDerive=typeof argon2==='function'?promisify(argon2):null;const derive=rawDerive?async(...args)=>{if(active>=2)throw Error('PASSWORD_HASH_CAPACITY');active++;try{return await rawDerive(...args)}finally{active--}}:null,settings={memory:65536,passes:3,parallelism:1,tagLength:32};
function password(value){if(typeof value!=='string'||value.length<12||value.length>128||Buffer.byteLength(value)>512)throw Error('PASSWORD_POLICY');return value}
async function hash(value){if(!derive)throw Error('ARGON2ID_RUNTIME_UNAVAILABLE');const nonce=randomBytes(16),out=await derive('argon2id',{message:password(value),nonce,...settings});return '$argon2id$v=19$m=65536,t=3,p=1$'+nonce.toString('base64').replace(/=+$/,'')+'$'+out.toString('base64').replace(/=+$/,'')}
async function verify({hash:encoded,password:value}){if(!derive||typeof encoded!=='string'||encoded.length>300)return false;const match=/^\$argon2id\$v=19\$m=65536,t=3,p=1\$([A-Za-z0-9+/]{22})\$([A-Za-z0-9+/]{43})$/.exec(encoded);if(!match)return false;try{const nonce=Buffer.from(match[1],'base64'),expected=Buffer.from(match[2],'base64');if(nonce.length!==16||expected.length!==32)return false;const out=await derive('argon2id',{message:password(value),nonce,...settings});return timingSafeEqual(out,expected)}catch{return false}}
module.exports={hash,verify,settings,password};
