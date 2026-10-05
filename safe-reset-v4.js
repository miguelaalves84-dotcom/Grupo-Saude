/* Grupo Saúde V4 — restauro seguro: nunca apagar configuração já definida */
(()=>{'use strict';
const KEY='grupo_saude_v4_demo_2';
const MASTER=['clinics','clinicStructure','specialtiesByClinic','specialties','professionals','users','jobRoles','contractTypes','documentTypes','requestOrigins','checklists','taskTemplates','clinicTaskConfig'];
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
function preserve(){const s=read(),m={};MASTER.forEach(k=>{if(s[k]!==undefined)m[k]=clone(s[k])});return m}
function restore(m){const s=read();Object.entries(m).forEach(([k,v])=>{s[k]=clone(v)});localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new CustomEvent('gs-v4-config-updated',{detail:{type:'master-data-restored'}}))}
function wrap(){if(!window.App||typeof App.resetDemo!=='function'||App.resetDemo.__safeV4)return false;const original=App.resetDemo.bind(App);const safe=function(){const master=preserve();const result=original();setTimeout(()=>{restore(master);try{window.ClinicMasterV4?.render?.();window.GSSearchV4?.refresh?.()}catch{}},0);return result};safe.__safeV4=true;App.resetDemo=safe;return true}
function boot(){if(wrap())return;let n=0;const t=setInterval(()=>{if(wrap()||++n>100)clearInterval(t)},50)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
})();