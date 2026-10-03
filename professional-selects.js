/* Grupo Saúde V4 — melhoria não destrutiva: seleção de profissionais por lista.
   Mantém app.js completo e atua apenas sobre os campos de profissionais da operação diária. */
(() => {
  'use strict';

  const clinicProfessionals = {
    c1: {
      doctors: ['Dra. Ana Silva','Dr. Luís Costa','Dr. Rui Matos','Dra. Sara Reis'],
      therapists: ['Terapeuta Rita Neves']
    },
    c2: {
      doctors: ['Dr. Tiago Luz','Dra. Inês Melo','Dra. Marta Dias'],
      therapists: []
    },
    c3: {
      doctors: ['Dra. Ana Silva','Dr. Pedro Sá','Dra. Eva Lima'],
      therapists: []
    }
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function currentClinic() {
    return document.getElementById('opClinic')?.value || 'c1';
  }

  function listFor(kind) {
    const data = clinicProfessionals[currentClinic()] || {doctors:[],therapists:[]};
    return kind === 'doctor' ? data.doctors : data.therapists;
  }

  function inferKind(table) {
    const heading = table?.closest('.card')?.textContent || '';
    const firstHeader = table?.querySelector('th')?.textContent || '';
    return /Técnico|terapeuta/i.test(firstHeader + ' ' + heading) ? 'therapist' : 'doctor';
  }

  function enhanceProfessionalInputs() {
    const root = document.getElementById('operationContent');
    if (!root) return;
    root.querySelectorAll('table tbody tr').forEach(row => {
      const input = row.querySelector('td:first-child input:not([type]), td:first-child input[type="text"]');
      if (!input || input.dataset.professionalEnhanced) return;
      const onchange = input.getAttribute('onchange') || '';
      if (!/App\.updateProfessional\(/.test(onchange) || !/'name'/.test(onchange)) return;

      const kind = inferKind(row.closest('table'));
      const allowed = listFor(kind);
      const current = input.value;
      const select = document.createElement('select');
      select.dataset.professionalEnhanced = '1';
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

  const observer = new MutationObserver(() => {
    enhanceProfessionalInputs();
    refreshAfterClinicChange();
  });

  document.addEventListener('DOMContentLoaded', () => {
    enhanceProfessionalInputs();
    refreshAfterClinicChange();
    const root = document.getElementById('operationContent');
    if (root) observer.observe(root, {childList:true, subtree:true});
  });
})();
