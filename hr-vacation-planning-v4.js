/* Planeamento partilhado; mantém os pontos de entrada antigos. */
(()=>{'use strict';
const allowed=()=>window.HRLeaveV4.canTeam(window.HRLeaveV4.read());
function open(){if(allowed())return window.HRLeaveUIV4.calendar()}
function render(){return window.HRLeaveUIV4.renderCalendar()}
function move(offset){const input=document.getElementById('vacMonth');if(!input)return;const [y,m]=input.value.split('-').map(Number);input.value=new Date(Date.UTC(y,m-1+offset,1,12)).toISOString().slice(0,7);input.dispatchEvent(new Event('change',{bubbles:true}))}
function wire(){const old=document.getElementById('vacPlanningQuick');if(old){old.hidden=!allowed();return}if(!allowed())return;const h=document.querySelector('#hr .page-head');if(h){const b=document.createElement('button');b.id='vacPlanningQuick';b.className='secondary';b.textContent='Calendário de férias';b.onclick=open;h.appendChild(b)}}
window.HRVacationPlanningV4={open,render,prev:()=>move(-1),next:()=>move(1)};document.addEventListener('gs:user-changed',wire);document.addEventListener('gs:permissions-applied',wire);setInterval(wire,800);setTimeout(wire,250);
})();
