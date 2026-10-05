/* Grupo Saúde V4 — compatibilidade RH.
   Os seletores de clínicas e especialidades são agora nativos de hr-master-v4.js.
   Este ficheiro fica intencionalmente sem mutações DOM para evitar re-renderizações concorrentes. */
(()=>{'use strict';window.HRFormFixV4={install(){},removeClinic(id){window.HRMasterV4?.removeClinic?.(id)},removeSpec(id){window.HRMasterV4?.removeSpec?.(id)}};})();
