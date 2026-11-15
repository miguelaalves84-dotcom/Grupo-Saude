"""Use actual controls to finish mandatory daily checks in regression scenarios."""
def complete_daily(page):
 if not page.evaluate("()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'));return !!s.days[s.opDate+'_'+s.opClinic]?.workflowChecks?.ending}"):
  page.evaluate('App.setPhase("open")');page.locator('#opSaveOpening').click()
 page.evaluate('App.setPhase("live")')
 ins=page.locator('#opWorkflow_insurance');sel=ins.locator('[data-work-option=answer]')
 if sel.is_disabled():
  for r in ins.locator('[data-work-row]').all():
   if 'Por rever hoje' in r.inner_text():r.locator('[data-work-field=skipToday]').check()
 else:sel.select_option('false')
 page.locator('#opWorkflow_sgtd [data-work-option=answer]').select_option('true')
 page.locator('#opSaveAll').click()
