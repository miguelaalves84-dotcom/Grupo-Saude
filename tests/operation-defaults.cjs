'use strict';
/* Valores por defeito da abertura: lista de espera/suspensos do fecho anterior e capacidade diária da ficha do técnico. */
const assert=require('node:assert/strict'),D=require('../operation-core-v4.js');let passed=0;const test=(n,f)=>{f();passed++;console.log('PASS',n)};
test('opening carries waiting list and suspended from the previous close of the same clinic',()=>{const s={clinics:[{id:'a'},{id:'b'}],users:[],employees:{},days:{
 '2026-10-18_a':{date:'2026-10-18',clinic:'a',close:{saved:true},indicators:{waitClicloud:{closing:4},suspended:{closing:1}}},
 '2026-10-19_a':{date:'2026-10-19',clinic:'a',close:{saved:true},indicators:{waitClicloud:{closing:7},suspended:{closing:3}}},
 '2026-10-19_b':{date:'2026-10-19',clinic:'b',close:{saved:true},indicators:{waitClicloud:{closing:99},suspended:{closing:99}}}}};
 D.prepare(s,'a','2026-10-20');const d=s.days['2026-10-20_a'];assert.equal(d.indicators.waitClicloud.current,7);assert.equal(d.indicators.suspended.current,3);assert.equal(d.indicators.waitClicloud.carriedFrom,'previous-close')});
test('without a previous close the opening starts at zero',()=>{const s={clinics:[{id:'a'}],users:[],employees:{},days:{}};D.prepare(s,'a','2026-10-20');assert.equal(s.days['2026-10-20_a'].indicators.waitClicloud.current,0)});
test('technician capacity: weekday value first, then daily capacity from the file',()=>{const p={id:'t',role:'TECNICO/A',kind:'therapist',hr:{dailyCapacity:28,weeklyCapacity:{1:{treatments:20}}}};assert.equal(D.capacity(p,'2026-10-19','treatments'),20);assert.equal(D.capacity(p,'2026-10-20','treatments'),28);assert.equal(D.capacity({...p,hr:{}},'2026-10-20','treatments'),null)});
console.log(JSON.stringify({passed,scope:'Operation opening defaults (synthetic)'}));
