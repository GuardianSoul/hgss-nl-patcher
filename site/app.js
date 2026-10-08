'use strict';
function patchWorker() {
  let current = null, manifest = null, original = null, originalFile = null, busy = false;
  const waiters = new Map(); let sequence = 0;
  const notify = (percent,text) => postMessage({type:'progress',percent,text});
  function readFile(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onprogress=e=>{if(e.lengthComputable)notify(Math.round(e.loaded/e.total*25),'Bestand openen…');};
      reader.onload=()=>resolve(new Uint8Array(reader.result));
      reader.onerror=()=>reject(new Error('Je bestand kon niet worden geopend. Kies het opnieuw.'));
      reader.readAsArrayBuffer(file);
    });
  }
  function requestPatch(file) {
    const id=++sequence;
    return new Promise((resolve,reject)=>{waiters.set(id,{resolve,reject});postMessage({type:'patch-request',id,file});});
  }
  async function stage(rom, spec, text, percent) {
    if (!spec) return rom;
    notify(percent,text);
    if (await HGNL.sha256(rom) !== spec.sourceSha256) throw new Error('De gekozen patch hoort bij een andere ROM-versie.');
    const packed = new Uint8Array(await requestPatch(spec.file));
    if (packed.length !== spec.bytes || await HGNL.sha256(packed) !== spec.sha256) throw new Error('Het vertaalpakket is beschadigd. Download het pakket opnieuw.');
    rom = HGNL.applyPatch(rom, await HGNL.unpack(packed));
    if (await HGNL.sha256(rom) !== spec.targetSha256) throw new Error('De controle na het patchen is mislukt. Er wordt geen bestand aangeboden.');
    return rom;
  }
  self.onmessage = async ({data}) => {
    if (data.type === 'patch-response') {
      const p=waiters.get(data.id); if(!p)return;waiters.delete(data.id);
      if(data.error)p.reject(new Error(data.error));else p.resolve(data.bytes);return;
    }
    if (busy) return; busy=true;
    try {
      if (data.type==='identify') {
        manifest=data.manifest;notify(0,'Bestand openen…');
        originalFile=data.file;
        const bytes=await readFile(originalFile);
        notify(25,'Bestand controleren…');
        current=await HGNL.identify(bytes,manifest,fraction=>notify(25+Math.round(fraction*70),'Bestand controleren…'));
        original=current.rom;notify(98,'Spelmenu laden…');
        let menuPixels=null;try{menuPixels=ROMUI.menuPixels(current.rom);}catch(e){/* Patching remains available if an optional preview is absent. */}
        postMessage({type:'ready',input:current.input,trimmed:current.trimmed,menuPixels});
      } else if (data.type==='patch') {
        if (!current || !originalFile) throw new Error('Kies eerst je eigen ROM.');
        const game=manifest.games[current.input.game], mask=data.mask;
        if (!Number.isInteger(mask)||!game.variants[String(mask)]) throw new Error('Onbekende naamkeuze.');
        let rom=original || (await HGNL.identify(new Uint8Array(await originalFile.arrayBuffer()),manifest)).rom; original=null;current.rom=null;
        rom=await stage(rom,current.input.normalize,'Spelversie voorbereiden…',12);
        rom=await stage(rom,game.basePatch,'Vertaling toepassen…',38);
        const variant=game.variants[String(mask)];
        rom=await stage(rom,variant.patch,'Naaminstellingen toepassen…',70);
        notify(93,'Resultaat controleren…');
        const digest=await HGNL.sha256(rom);
        if(digest!==variant.sha256)throw new Error('De eindcontrole is mislukt. Je oorspronkelijke ROM is behouden.');
        postMessage({type:'done',bytes:rom.buffer,game:current.input.game,mask,sha256:digest},[rom.buffer]);
      }
    } catch(e) {postMessage({type:'error',text:e.message||'Er is iets misgegaan.'});}
    finally {busy=false;}
  };
}
(() => {
  const $=id=>document.getElementById(id), manifest=globalThis.HGNLManifest;
  let worker=null, ready=false, objectUrl=null, epoch=0, busy=false;
  const jobs=new Map();
  let step=1;
  function navigation(){
    $('continue-file').disabled=!ready||busy;
    for(const id of ['back-file','continue-names','back-names'])$(id).disabled=busy;
    $('back-names').hidden=!!objectUrl;
  }
  function showStep(next){
    if(busy||next>1&&!ready)return;
    $('wizard').dataset.direction=next<step?'back':'forward';step=next;
    for(let n=1;n<=3;n++)$('step-'+n).hidden=n!==step;
    document.querySelectorAll('.step-track li').forEach((li,i)=>{if(i+1===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
    if(step===3){const english=['items','places','moves','abilities'].filter(id=>$(id).checked).map(id=>({items:'items',places:'plaatsen',moves:'aanvallen',abilities:'vaardigheden'})[id]);$('choices-summary').textContent=english.length?'Engelse namen: '+english.join(', ')+'. Het verhaal blijft Nederlands.':'Alle namen in het Nederlands.';}
    navigation();$(step===1?'file-title':step===2?'names-title':'save-title').focus({preventScroll:true});
  }
  $('continue-file').addEventListener('click',()=>showStep(2));
  $('back-file').addEventListener('click',()=>showStep(1));
  $('continue-names').addEventListener('click',()=>showStep(3));
  $('back-names').addEventListener('click',()=>showStep(2));
  function error(text){$('error').textContent=text;$('error').hidden=false;$('progress-wrap').hidden=true;$('rom-file').disabled=false;busy=false;if(ready){$('options').disabled=false;$('patch-button').disabled=false;}navigation();}
  function clearDownload(){if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;$('done').hidden=true;}
  function progress(percent,text){$('progress-wrap').hidden=false;$('progress').value=percent;$('progress-text').textContent=text+' '+Math.round(percent)+'%';}
  function decode64(value){const string=atob(value);const b=new Uint8Array(string.length);for(let i=0;i<string.length;i++)b[i]=string.charCodeAt(i);return b;}
  // Script transport works on a static website AND after double-clicking the
  // offline index.html. Only compressed patch masks are read, never ROM bytes.
  globalThis.HGNLPatchReceived=(file,value)=>{const job=jobs.get(file);if(!job)return;jobs.delete(file);job.script.remove();try{job.resolve(decode64(value));}catch(e){job.reject(e);}};
  function loadPatch(file){
    if(!/^patches\/[a-z0-9-]+\.xor\.gz$/.test(file))return Promise.reject(new Error('Onverwacht patchbestand.'));
    if(jobs.has(file))return jobs.get(file).promise;
    const script=document.createElement('script');let resolve,reject;
    const promise=new Promise((a,b)=>{resolve=a;reject=b;});
    jobs.set(file,{script,resolve,reject,promise});script.src=file+'.js?v='+encodeURIComponent(manifest.release);
    script.onerror=()=>{script.remove();jobs.delete(file);reject(new Error('Het vertaalpakket kon niet worden geopend. Houd de map “patches” bij index.html.'));};
    document.head.append(script);return promise;
  }
  function createWorker(){
    if(worker)worker.terminate();
    const fast=typeof HGNLFastShaFactory==='function'?'('+HGNLFastShaFactory.toString()+')();':'';
    const source=fast+'('+HGNLEngineFactory.toString()+')();('+ROMUIFactory.toString()+')();('+patchWorker.toString()+')();';
    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));worker=new Worker(url);URL.revokeObjectURL(url);
    const active=worker, generation=epoch;
    worker.onerror=()=>{if(generation===epoch)error('De achtergrondverwerking kon niet starten. Gebruik een recente browser.');};
    worker.onmessage=async({data})=>{
      if(generation!==epoch)return;
      if(data.type==='progress')progress(data.percent,data.text);
      if(data.type==='patch-request'){
        try{const bytes=await loadPatch(data.file);active.postMessage({type:'patch-response',id:data.id,bytes:bytes.buffer},[bytes.buffer]);}
        catch(e){active.postMessage({type:'patch-response',id:data.id,error:e.message});}
      } else if(data.type==='ready'){
        ready=true;busy=false;$('options').disabled=false;$('patch-button').disabled=false;$('rom-file').disabled=false;$('progress-wrap').hidden=true;navigation();
        $('file-description').textContent='Bestand klaar. Kies Doorgaan.';
        document.body.dataset.game=data.input.game;
        if(data.menuPixels){const canvas=document.createElement('canvas');canvas.width=canvas.height=24;canvas.getContext('2d').putImageData(new ImageData(data.menuPixels,24,24),0,0);document.body.style.setProperty('--rom-menu-frame','url("'+canvas.toDataURL()+'")');document.body.dataset.romFrame='true';}document.querySelector('.display-subtitle').textContent='Spelbestand gecontroleerd.';
        $('rom-status').className='rom-status valid';$('rom-status').textContent='✓ '+data.input.label+(data.trimmed?' · getrimd bestand hersteld':' · origineel gecontroleerd');
        $('edition').textContent=manifest.games[data.input.game].label.toUpperCase();$('ticket-game').textContent=manifest.games[data.input.game].label;
      } else if(data.type==='error')error(data.text);
      else if(data.type==='done'){
        progress(100,'Alles gecontroleerd. Je bestand is klaar.');busy=false;$('rom-file').disabled=false;
        clearDownload();objectUrl=URL.createObjectURL(new Blob([data.bytes],{type:'application/octet-stream'}));
        const labels=['items','places','moves','abilities'].filter((_,i)=>data.mask&(1<<i));
        $('download').href=objectUrl;$('download').download=manifest.games[data.game].label+'-NL'+(labels.length?'-EN-'+labels.join('-'):'')+'.nds';
        navigation();$('done').hidden=false;$('patch-button').hidden=true;$('progress-wrap').hidden=true;$('done').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
      }
    };
  }
  async function select(file){
    if(!file||busy)return;
    epoch++;ready=false;busy=true;delete document.body.dataset.game;delete document.body.dataset.romFrame;document.body.style.removeProperty('--rom-menu-frame');document.querySelector('.display-subtitle').textContent='Spelbestand controleren…';clearDownload();$('options').disabled=true;$('patch-button').disabled=true;$('patch-button').hidden=false;$('error').hidden=true;navigation();
    $('rom-status').className='rom-status';$('rom-status').textContent='';$('rom-icon').hidden=true;$('edition').textContent='HEARTGOLD / SOULSILVER';$('ticket-game').textContent='Nog niet gekozen';
    $('file-heading').textContent=file.name;$('file-description').textContent=(file.size/1048576).toFixed(1)+' MB · wordt lokaal gecontroleerd';$('rom-file').disabled=true;
    if(file.size<0x200||file.size>134217728){error('Kies een HeartGold- of SoulSilver-ROM van maximaal 128 MB.');return;}
    progress(1,'Je bestand lokaal openen…');
    try{
      const header=new Uint8Array(await file.slice(0,0x200).arrayBuffer());const at=new DataView(header.buffer).getUint32(0x68,true);
      let pixels=null;if(at&&at+0x240<=file.size){const block=new Uint8Array(await file.slice(at,at+0x240).arrayBuffer());const icon=new Uint8Array(0x240+0x200);new DataView(icon.buffer).setUint32(0x68,0x200,true);icon.set(block,0x200);pixels=HGNL.banner(icon);}
      if(pixels){$('rom-icon').getContext('2d').putImageData(new ImageData(pixels,32,32),0,0);$('rom-icon').hidden=false;}
      createWorker();worker.postMessage({type:'identify',file,manifest});
    }catch(e){error(e.message);}
  }
  if(!manifest){error('Het vertaalpakket ontbreekt. Open de index.html uit het complete distributiepakket.');$('rom-file').disabled=true;return;}
  $('release').textContent='VERSIE '+manifest.release;
  for(const input of manifest.inputs){const li=document.createElement('li');li.textContent=input.label;$('supported-roms').append(li);}
  $('rom-file').addEventListener('change',e=>select(e.target.files[0]));
  for(const type of ['dragenter','dragover'])$('dropzone').addEventListener(type,e=>{e.preventDefault();if(!busy)$('dropzone').classList.add('dragging');});
  for(const type of ['dragleave','drop'])$('dropzone').addEventListener(type,e=>{e.preventDefault();$('dropzone').classList.remove('dragging');if(type==='drop'&&!busy)select(e.dataTransfer.files[0]);});
  $('patch-button').addEventListener('click',()=>{if(!ready||busy)return;clearDownload();busy=true;$('error').hidden=true;$('patch-button').disabled=true;$('options').disabled=true;$('rom-file').disabled=true;navigation();const mask=['items','places','moves','abilities'].reduce((n,id,i)=>n|($(id).checked?1<<i:0),0);worker.postMessage({type:'patch',mask});});
  $('again').addEventListener('click',()=>{clearDownload();$('options').disabled=false;$('patch-button').disabled=false;$('patch-button').hidden=false;showStep(2);});
  window.addEventListener('beforeunload',()=>{if(worker)worker.terminate();if(objectUrl)URL.revokeObjectURL(objectUrl);});
})();
