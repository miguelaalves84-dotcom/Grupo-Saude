"""Phase 1 in Chromium: actual DOM, local persisted data, six effective profiles."""
import json
import os
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
KEY = 'grupo_saude_v4_demo_2'
ACTORS = ['u1', 'test_admin', 'test_adm', 'test_call', 'test_med', 'test_tec']
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
    context = browser.new_context()
    if os.environ.get('GS_PHASE1_BASELINE_SCHEDULED'):
        original = subprocess.check_output(['git', 'show', '1e769bc:scheduled-indicators.js'], cwd=ROOT, text=True)
        context.route('**/scheduled-indicators.js*', lambda route: route.fulfill(status=200, body=original, content_type='application/javascript'))
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('dialog', lambda dialog: dialog.dismiss())
    page.goto(os.environ['GS_TEST_URL'])
    page.wait_for_function('window.V4Scheduled && window.RoleAccessAdminV4 && window.CommunicationsV4')
    page.wait_for_timeout(400)
    page.evaluate('''key=>{const s=JSON.parse(localStorage.getItem(key));
      s.clinics=[{id:'phase_a',name:'Phase A',active:true},{id:'phase_b',name:'Phase B',active:true},{id:'phase_inactive',name:'Historic',active:false}];
      for(const u of [...s.users,...Object.values(s.employees)]){u.clinics=['phase_a'];u.clinicIds=[];u.clinic='';u.clinicId='';}
      s.candidates=[{id:'inside',name:'Inside candidate',email:'inside@example.invalid',clinic:'phase_a',stage:'Recebido',documents:[],history:[]},
        {id:'outside',name:'PRIVATE OUTSIDE CANDIDATE',email:'outside@example.invalid',clinic:'phase_b',stage:'Aprovado',documents:[],history:[]},
        {id:'unassigned',name:'Legacy unassigned',stage:'Recebido',documents:[],history:[]}];
      s.currentUser='u1';s.opClinic='phase_a';s.tasks=[];s.opDate=new Date().toLocaleDateString('sv-SE');s.userActionPermissions={};
      s.days[s.opDate+'_phase_a']={...structuredClone(Object.values(s.days)[0]),date:s.opDate,clinic:'phase_a',closed:false};s.days[s.opDate+'_phase_a'].open.saved=true;
      s.timeOccurrences=[{id:'occ',user:'test_med',clinic:'phase_a',status:'Pendente'}];
      localStorage.setItem(key,JSON.stringify(s));App.renderAll();
      App.showView('operation');
      window.phasePanelMutations=0;new MutationObserver(records=>{window.phasePanelMutations+=records.length}).observe(document.getElementById('operationContent'),{childList:true,subtree:true});
    }''', KEY)
    page.wait_for_timeout(600)
    mutations = page.evaluate('window.phasePanelMutations')
    assert mutations < 10, f'Panel produces mutations without data changes: {mutations}'
    print('PASS scheduled Chromium settles:', mutations, flush=True)
    for actor in ACTORS:
        result = page.evaluate('''([key,actor])=>{const s=JSON.parse(localStorage.getItem(key));s.currentUser=actor;s.ceoViewingAs=actor==='u1'?null:actor;localStorage.setItem(key,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'));
          const canClose=RoleAccessAdminV4.can('closeClinic');const before=JSON.parse(localStorage.getItem(key)).days[s.opDate+'_phase_a'].closed;
          App.attemptClose();const after=JSON.parse(localStorage.getItem(key)).days[s.opDate+'_phase_a'].closed;
          const canPoint=AccessScopeV4.canTimeOccurrence(s.timeOccurrences[0],s);const status=s.timeOccurrences[0].status;
          V4TimeAdmin.decide('occ','accepted');const point=JSON.parse(localStorage.getItem(key)).timeOccurrences[0].status;
          let candidates;try{candidates=CommunicationsV4.candidates().map(c=>c.id)}catch{candidates=[]}
          const snap=localStorage.getItem(key);App.archiveCandidate('outside');const protectedLegacy=actor==='u1'||localStorage.getItem(key)===snap;
          return {canClose,before,after,canPoint,status,point,candidates,protectedLegacy};}''', [KEY, actor])
        assert result['after'] != result['before'] if result['canClose'] else result['after'] == result['before'], (actor, result)
        assert result['point'] == 'accepted' if result['canPoint'] else result['point'] == result['status'], (actor, result)
        expected = ['inside', 'outside', 'unassigned'] if actor == 'u1' else ['inside'] if actor == 'test_admin' else []
        assert result['candidates'] == expected, (actor, result)
        assert result['protectedLegacy'], (actor, result)
        print('PASS effective profile:', actor, flush=True)
    page.evaluate('''key=>{const s=JSON.parse(localStorage.getItem(key));s.currentUser='test_admin';s.ceoViewingAs='test_admin';localStorage.setItem(key,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'));CommunicationsV4.candidate('inside')}''', KEY)
    assert page.locator('#modal').is_visible()
    assert page.locator('#modalBody').inner_text().find('inside@example.invalid') >= 0
    page.select_option('#candidateStage', 'Em análise')
    page.click('#candidateSave')
    assert page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).candidates.find(c=>c.id==="inside").stage', KEY) == 'Em análise'
    page.evaluate('CommunicationsV4.importForm()')
    page.select_option('#cvClinic', 'phase_a')
    page.fill('#cvName', 'Imported within scope')
    page.fill('#cvEmail', 'new-phase1@example.invalid')
    page.fill('#cvSource', 'phase1-source')
    page.click('#cvImport')
    page.wait_for_function('document.getElementById("modalBody").textContent.includes("new-phase1@example.invalid")')
    page.evaluate('''key=>{const s=JSON.parse(localStorage.getItem(key));s.currentUser='test_med';localStorage.setItem(key,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'))}''', KEY)
    assert not page.locator('#modal').is_visible()
    assert 'new-phase1@example.invalid' not in page.locator('#modalBody').inner_text()
    print('PASS candidate UI update, scoped import and private modal cleanup', flush=True)
    page.evaluate('''key=>{const s=JSON.parse(localStorage.getItem(key));for(const u of [s.users.find(u=>u.id==='test_med'),s.employees.test_med])u.clinics=['phase_a','phase_inactive','missing-historic'];
      s.contractTypes.push({id:'phase_legacy',items:[{id:'proof',name:'Legacy evidence',required:false,custom:'retain'}]});
      localStorage.setItem(key,JSON.stringify(s));V4DataIntegrity.repair();}''', KEY)
    page.reload()
    page.wait_for_timeout(600)
    preserved = page.evaluate('''key=>{const s=JSON.parse(localStorage.getItem(key));return {clinics:s.users.find(u=>u.id==='test_med').clinics,item:s.contractTypes.find(c=>c.id==='phase_legacy').items[0],scope:AccessScopeV4.clinics(s)}}''', KEY)
    assert 'missing-historic' in preserved['clinics'] and 'phase_inactive' in preserved['clinics']
    assert preserved['item']['id'] == 'proof' and preserved['item']['custom'] == 'retain'
    assert 'phase_inactive' not in preserved['scope'] and 'missing-historic' not in preserved['scope']
    assert not errors, errors
    print('PASS reload preserves evidence and historical associations without operational grants', flush=True)
    context.close()
    browser.close()
