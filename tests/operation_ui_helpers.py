"""Use actual controls to finish mandatory daily checks in regression scenarios."""
def complete_daily(page):
 page.evaluate('App.setPhase("live")')
 for kind in ['consultations','insuranceCheck','sgtd','absence']:
  panel=page.locator('#opWorkflow_'+kind)
  if kind in ['insuranceCheck','sgtd']:panel.locator('[data-work-option=answer]').select_option('false' if kind=='insuranceCheck' else 'true')
  if kind=='insuranceCheck':panel.locator('[data-work-option=confirm]').check()
  panel.locator('[data-work-save]').click()
