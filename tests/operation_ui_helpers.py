"""Use actual controls to finish mandatory daily checks in regression scenarios."""
def complete_daily(page):
 if not page.evaluate("()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'));return !!s.days[s.opDate+'_'+s.opClinic]?.workflowChecks?.ending}"):
  page.evaluate('App.setPhase("open")');page.locator('#opSaveOpening').click()
 page.evaluate('App.setPhase("live")')
 for kind in ['consultations','insuranceCheck','sgtd','absence']:
  panel=page.locator('#opWorkflow_'+kind)
  if kind in ['insuranceCheck','sgtd']:panel.locator('[data-work-option=answer]').select_option('false' if kind=='insuranceCheck' else 'true')
  if kind=='insuranceCheck':panel.locator('[data-work-option=confirm]').check()
  panel.locator('[data-work-save]').click()
