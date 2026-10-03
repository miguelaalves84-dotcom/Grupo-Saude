/* Grupo Saúde V4 — seleção não destrutiva de profissionais por lista. */
(() => {
  'use strict';

  const clinicProfessionals = {
    c1: { doctors: ['Dra. Ana Silva','Dr. Luís Costa','Dr. Rui Matos','Dra. Sara Reis'], therapists: ['Terapeuta Rita Neves'] },
    c2: { doctors: ['Dr. Tiago Luz','Dra. Inês Melo','Dra. Marta Dias'], therapists: [] },
    c3: { doctors: ['Dra. Ana Silva','Dr. Pedro Sá','Dra. Eva Lima'], therapists: [] }
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const currentClinic = () => document.getElementById('opClinic')?.value || 'c1';
  const listFor = kind => (clinicProfessionals[currentClinic()] || {doctors:[],therapists:[]})[kind === 'doctor' ? 'doctors' : 'therapists'];

  function inferKind(row, input) {
    const current = (input?.value || '').trim();
    if (/^(Dr\.|Dra\.)/i.test(current)) return 'doctor';
    if (/terapeuta|técnic|fisioterapeuta/i.test(current)) return 'therapist';
    const firstHeader = row.closest('table')?.querySelector('th')?.textContent || '';
    return /técnic|terapeuta/i.test(firstHeader) ? 'therapist' : 'doctor';
  }

  function enhanceProfessionalInputs() {
    const root = document.getElementById('operationContent');
    if (!root) return;
    root.querySelectorAll('table tbody tr').forEach(row => {
      const input = row.querySelector('td:first-child input:not([type]), td:first-child input[type="text"]');
      if (!input) return;
      const onchange = input.getAttribute('onchange') || '';
      if (!/App\.updateProfessional\(/.test(onchange) || !/'name'/.test(onchange)) return;

      const kind = inferKind(row, input);
      const allowed = listFor(kind);
      const current = input.value;
      const select = document.createElement('select');
      select.dataset.professionalEnhanced = '1';
      select.dataset.professionalKind = kind;
      select.setAttribute('aria-label', kind === 'doctor' ? 'Selecionar médico' : 'Selecionar técnico ou terapeuta');
      select.innerHTML = `<option value="">Selecionar…</option>` + allowed.map(name => `<option value="${esc(name)}" ${name === current ? 'selected' : ''}>${esc(name)}</option>`).join('');
      select.addEventListener('change', () => {
        const match = onchange.match(/App\.updateProfessional\((\d+),'name',this\.value,(true|false)\)/);
        if (match && window.App?.updateProfessional) App.updateProfessional(Number(match[1]), 'name', select.value, match[2] === 'true');
      });
      input.replaceWith(select);
    });
  }

  function refreshAfterClinicChange() {
    const clinic = document.getElementById('opClinic');
    if (!clinic || clinic.dataset.professionalListHook) return;
    clinic.dataset.professionalListHook = '1';
    clinic.addEventListener('change', () => setTimeout(enhanceProfessionalInputs, 0));
  }

  const observer = new MutationObserver(() => { enhanceProfessionalInputs(); refreshAfterClinicChange(); });
  document.addEventListener('DOMContentLoaded', () => {
    enhanceProfessionalInputs();
    refreshAfterClinicChange();
    const root = document.getElementById('operationContent');
    if (root) observer.observe(root, {childList:true, subtree:true});
  });
})();
