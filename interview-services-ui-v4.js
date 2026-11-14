/* Existing audio/transcription controls, mounted once in the canonical center.
   Disabled until secure storage, supplier/privacy review and explicit activation are validated. */
(()=>{'use strict';
window.GSInterviewServicesUI=function(root,{id,server,api,record:entry,valid}){
 const capabilities=Object.freeze({recording:false,live:false,ai:false});
 const safe=fn=>async()=>{try{if(!valid())throw Error('A sessão mudou.');await fn()}catch(e){alert(e.message)}};
 let interviewRecorder=null,interviewStream=null,interviewChunks=[];
 function releaseInterviewMic(){if(interviewRecorder?.state==='recording'||interviewRecorder?.state==='paused')interviewRecorder.stop();interviewStream?.getTracks().forEach(t=>t.stop());interviewStream=null}
 root.querySelector('#interviewServices').innerHTML=`<fieldset><legend>Gravação opcional e assistente</legend><p>Gravação indisponível — armazenamento privado, controlo de acesso e conservação pendentes. Recusar gravação não prejudica a candidatura. A ativação requer finalidade, base legal e informação aos intervenientes.</p><label><input id="interviewConsent" type="checkbox" disabled> Consentimento informado (quando aplicável)</label><div class="actions"><button id="interviewRecord" disabled>Iniciar gravação</button><button id="interviewPause" disabled>Pausar / Retomar</button><button id="interviewStop" disabled>Terminar</button></div><p id="interviewRecordingStatus" role="status">Nenhuma gravação iniciada.</p><div id="interviewPlayback"></div><label>Carregar gravação<input id="interviewUpload" type="file" accept="audio/*" disabled></label><label><input id="liveConsent" type="checkbox" disabled> Processamento em direto autorizado</label><button id="liveStart" disabled>Iniciar transcrição em direto</button><button id="liveStop" disabled>Parar transcrição</button><p id="liveStatus">Transcrição indisponível — configuração pendente</p><div id="liveSuggestions"></div><p id="interviewAIStatus">IA indisponível — fornecedor e tratamento de dados por validar.</p><div class="actions"><button disabled>Transcrever entrevista</button><button disabled>Gerar resumo com IA</button><button disabled>Analisar entrevista com IA</button></div></fieldset><label>Transcrição manual — revisão humana<textarea id="interviewTranscript" rows="5"></textarea></label><label>Relatório do entrevistador — conteúdo humano<textarea id="interviewAssessment" rows="5"></textarea></label>`;
 root.querySelector('#interviewTranscript').value=entry.transcript?.text||'';root.querySelector('#interviewAssessment').value=entry.humanReport||'';
 root.collectInterviewServices=()=>({transcriptManual:root.querySelector('#interviewTranscript').value,humanReport:root.querySelector('#interviewAssessment').value});
 root.querySelectorAll('#interviewTranscript,#interviewAssessment').forEach(t=>GSSafeActionsV4.bindInput(t,()=>root.dispatchEvent(new CustomEvent('interview-change'))));
 const status=document.getElementById('interviewRecordingStatus'),record=document.getElementById('interviewRecord'),pause=document.getElementById('interviewPause'),stop=document.getElementById('interviewStop');
 const playback=document.getElementById('interviewPlayback');
 let speech=null,liveRunning=false,liveFinal='',liveInterim='';
 const liveStart=document.getElementById('liveStart'),liveStop=document.getElementById('liveStop'),liveStatus=document.getElementById('liveStatus'),liveSuggestions=document.getElementById('liveSuggestions');
 const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 function liveHints(t){const s=t.toLocaleLowerCase('pt-PT');const hints=[];if(/experiên|trabalh|funç|cargo/.test(s))hints.push('Pode descrever um caso concreto e qual foi o seu contributo?');if(/equipa|colega|conflito|comunica/.test(s))hints.push('Como resolveu essa situação com a equipa?');if(/prioridad|urgên|prazo|organiza/.test(s))hints.push('Como decidiu as prioridades e qual foi o resultado?');if(/pacient|utente|consulta|clínica/.test(s))hints.push('Que procedimento utilizou e como verificou o resultado?');if(!hints.length)hints.push('Que exemplo concreto demonstra essa competência?','Qual foi o resultado e o que faria de forma diferente?');liveSuggestions.replaceChildren(...hints.slice(0,3).map(h=>{const p=document.createElement('p');p.textContent='• '+h;return p}))}
 function finishLive(){liveRunning=false;liveStart.disabled=false;liveStop.disabled=true;liveStatus.textContent='Transcrição em direto terminada. Reveja o texto antes de guardar.';if(speech){const old=speech;speech=null;old.onend=null;try{old.stop()}catch(_){}}}
 liveStart.onclick=()=>{if(!capabilities.live){liveStatus.textContent='Transcrição indisponível — configuração pendente';return}if(!document.getElementById('liveConsent').checked){liveStatus.textContent='Confirme primeiro o consentimento para o teste com voz fictícia.';return}if(!SpeechRecognition){liveStatus.textContent='Este navegador não suporta reconhecimento de voz em direto. Não foi iniciada qualquer transcrição.';return}try{speech=new SpeechRecognition();speech.lang='pt-PT';speech.continuous=true;speech.interimResults=true;liveFinal=document.getElementById('interviewTranscript').value;liveRunning=true;speech.onresult=e=>{liveInterim='';for(let j=e.resultIndex;j<e.results.length;j++){const v=e.results[j][0]?.transcript||'';if(e.results[j].isFinal)liveFinal+=(liveFinal?' ':'')+v;else liveInterim+=v}const field=document.getElementById('interviewTranscript');if(field)field.value=liveFinal+(liveInterim?' '+liveInterim:'');liveHints(liveFinal+' '+liveInterim)};speech.onerror=e=>{liveStatus.textContent='Reconhecimento interrompido: '+e.error;finishLive()};speech.onend=()=>{if(liveRunning){try{speech.start()}catch(_){finishLive()}}};speech.start();liveStart.disabled=true;liveStop.disabled=false;liveStatus.textContent='A transcrever em direto. As sugestões são locais e não constituem análise de IA.'}catch(e){liveStatus.textContent='Não foi possível iniciar: '+e.message;finishLive()}};
 liveStop.onclick=finishLive;
 const dialog=document.getElementById('modal');dialog?.addEventListener('close',()=>{finishLive();releaseInterviewMic();URL.revokeObjectURL(playback.querySelector('audio')?.src||'')},{once:true});

 async function processInterviewAudio(blob){
  const state=document.getElementById('interviewAIStatus');
  if(!capabilities.ai||!server){state.textContent='Demonstração local: transcrição automática indisponível. Utilize a área autenticada de testes.';return}
  if(blob.size>2900000){state.textContent='Áudio demasiado longo para processamento automático nesta fase (limite de 2,8 MB). Descarregue-o e guarde-o em segurança.';return}
  state.textContent='A transcrever áudio e a preparar o relatório...';
  const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  try{
   const result=await api('interview-ai',{candidateId:id,audio:btoa(binary),consent:document.getElementById('interviewConsent').checked});
   if(!document.getElementById('interviewTranscript'))return;
   document.getElementById('interviewTranscript').value=result.transcript||'';
   document.getElementById('interviewAssessment').value=result.report||'';
   state.textContent='Transcrição e relatório concluídos. Reveja e guarde o registo da entrevista.';
  }catch(err){state.textContent='Não foi possível processar automaticamente: '+err.message+' Descarregue o áudio e conserve-o para nova tentativa.'}
 }

 function preview(blob){const url=URL.createObjectURL(blob);playback.replaceChildren();const audio=document.createElement('audio');audio.controls=true;audio.src=url;const link=document.createElement('a');link.href=url;link.download='entrevista-'+String(id).replace(/[^a-z0-9_-]/gi,'')+'.webm';link.textContent='Descarregar gravação (guardar antes de sair)';playback.append(audio,link)}
 record.onclick=safe(async()=>{if(!capabilities.recording)throw Error('Gravação indisponível — armazenamento privado e política de conservação pendentes.');
  if(!document.getElementById('interviewConsent').checked)throw Error('Confirme a informação e autorização dos participantes antes de gravar.');
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('O navegador não suporta gravação de áudio.');
  try {
   interviewStream=await navigator.mediaDevices.getUserMedia({audio:true});
  } catch(err) {
   const blocked=['NotAllowedError','PermissionDeniedError','SecurityError'].includes(err?.name)||/permission denied/i.test(err?.message||'');
   const policy=document.permissionsPolicy||document.featurePolicy;
   const restricted=typeof policy?.allowsFeature==='function'&&!policy.allowsFeature('microphone');
   const message=restricted?'A política de segurança desta página impede o acesso ao microfone. É necessária uma correção na configuração do preview.':blocked?'O Chrome recusou o acesso ao microfone. Verifique a permissão deste site e do Chrome no Android, e se o acesso geral ao microfone está ativo. Se já autorizou tudo, envie este diagnóstico para verificarmos a configuração do preview.':'Não foi possível iniciar o microfone. Verifique se está ligado e disponível.';
   status.textContent=message+' (diagnóstico: '+String(err?.name||'desconhecido')+')';
   throw Error(message);
  }
  interviewChunks=[];
  interviewRecorder=new MediaRecorder(interviewStream);
  interviewRecorder.ondataavailable=e=>{if(e.data.size)interviewChunks.push(e.data)};
  interviewRecorder.onstop=()=>{const blob=new Blob(interviewChunks,{type:interviewRecorder.mimeType||'audio/webm'});preview(blob);interviewStream?.getTracks().forEach(t=>t.stop());interviewStream=null;status.textContent='Gravação terminada. Descarregue o ficheiro.';status.textContent+=' Transcrição e IA requerem uma ação explícita.'};
  interviewRecorder.start();record.disabled=true;pause.disabled=false;stop.disabled=false;status.textContent='A gravar...';
 });
 pause.onclick=()=>{if(!interviewRecorder)return;if(interviewRecorder.state==='recording'){interviewRecorder.pause();pause.textContent='Retomar';status.textContent='Gravação pausada'}else if(interviewRecorder.state==='paused'){interviewRecorder.resume();pause.textContent='Pausar';status.textContent='A gravar...'}};
 stop.onclick=()=>{if(interviewRecorder&&interviewRecorder.state!=='inactive')interviewRecorder.stop();record.disabled=false;pause.disabled=true;stop.disabled=true};
 document.getElementById('interviewUpload').onchange=e=>{const file=e.target.files?.[0];if(capabilities.recording&&file&&file.type.startsWith('audio/'))preview(file)};

};
})();
