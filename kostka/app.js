/* ---------- Storage and data model (with allocations/profiles) ---------- */
const STORAGE_KEY = 'rubik_alloc_v1';

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){
      const legacy = localStorage.getItem('rubik_sessions_v1');
      if(legacy){
        const parsed = JSON.parse(legacy);
        const alloc = { id: Date.now(), name: 'Default', sessions: parsed.sessions || [] };
        const s = { allocations: [alloc], currentAllocationId: alloc.id };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        return s;
      }
      const alloc = { id: Date.now(), name: 'Default', sessions: [] };
      const s = { allocations: [alloc], currentAllocationId: alloc.id };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw);
  }catch(e){
    console.error(e);
    const alloc = { id: Date.now(), name: 'Default', sessions: [] };
    const s = { allocations: [alloc], currentAllocationId: alloc.id };
    return s;
  }
}
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

function getAllocationById(state, id){
  return state.allocations.find(a => a.id === id) || null;
}
function getCurrentAllocation(state){
  if(!state || !state.allocations || state.allocations.length===0) return null;
  const id = state.currentAllocationId != null ? state.currentAllocationId : state.allocations[0].id;
  return getAllocationById(state, id) || state.allocations[0];
}
function setCurrentAllocation(state, id){
  state.currentAllocationId = id;
  saveState(state);
}

function createAllocation(state, name='New'){
  const a = { id: Date.now() + Math.floor(Math.random()*1000), name: name, sessions: [] };
  state.allocations.push(a);
  state.currentAllocationId = a.id;
  saveState(state);
  return a;
}
function deleteAllocation(state, id){
  const idx = state.allocations.findIndex(x=>x.id===id);
  if(idx===-1) return false;
  state.allocations.splice(idx,1);
  if(state.allocations.length===0){
    createAllocation(state,'Default');
  }
  if(state.currentAllocationId === id){
    state.currentAllocationId = state.allocations[0].id;
  }
  saveState(state);
  return true;
}
function renameAllocation(state, id, newName){
  const a = getAllocationById(state,id);
  if(!a) return false;
  a.name = newName;
  saveState(state);
  return true;
}

function createSessionInCurrentAllocation(state){
  const alloc = getCurrentAllocation(state);
  if(!alloc) return null;
  const s = { id: Date.now(), createdAt: new Date().toISOString(), results: [], pinned:false };
  alloc.sessions.push(s);
  saveState(state);
  return s;
}
function getCurrentSession(state){
  const alloc = getCurrentAllocation(state);
  if(!alloc || alloc.sessions.length===0) return null;
  return alloc.sessions[alloc.sessions.length-1];
}

/* ---------- Formatting & stats ---------- */
function fmtTimeMs(ms){ if(ms==null) return '—'; return (ms/1000).toFixed(2) + 's'; }

function allResultsFlattenedCurrentAllocation(state){
  const alloc = getCurrentAllocation(state);
  if(!alloc) return [];
  const r=[];
  alloc.sessions.forEach(sess => { if(Array.isArray(sess.results)) sess.results.forEach(res => r.push(res.timeMs)); });
  return r;
}
function bestSingle(flat){ if(flat.length===0) return null; return Math.min(...flat); }
function bestAverage(flat,window){ if(flat.length<window) return null; let best=Infinity; for(let i=0;i+window<=flat.length;i++){ const win = flat.slice(i,i+window); const arr = win.slice().sort((a,b)=>a-b); arr.shift(); arr.pop(); const avg = arr.reduce((a,b)=>a+b,0)/arr.length; if(avg < best) best = avg; } return Number.isFinite(best)?Math.round(best):null; }

/* ---------- Scramble generation ---------- */
let scrambleMode = '2g';
function generate2G(length=20){ const faces=['R','U']; const suf=['','\'','2']; const res=[]; let last=null; while(res.length<length){ const f=faces[Math.floor(Math.random()*faces.length)]; if(f===last) continue; last=f; res.push(f + suf[Math.floor(Math.random()*suf.length)]); } return res.join(' '); }
function generateStd(length=20){ const faces=['R','L','U','D','F','B']; const suf=['','\'','2']; const res=[]; let last=null; while(res.length<length){ const f=faces[Math.floor(Math.random()*faces.length)]; if(f===last) continue; last=f; res.push(f + suf[Math.floor(Math.random()*suf.length)]); } return res.join(' '); }
function generateScramble(){ return scrambleMode === '2g' ? generate2G(20) : generateStd(20); }

/* ---------- App init (DOM refs will be set inside init) ---------- */
function initApp(){
  /* ---------- DOM refs ---------- */
  const timerBtn = document.getElementById('timerBtn');
  const scoresBtn = document.getElementById('scoresBtn');
  const navBtns = [timerBtn, scoresBtn];

  const practiceBtn = document.getElementById('practiceBtn');
  const practiceBar = document.getElementById('practiceBar');
  const practiceScramble = document.getElementById('practiceScramble');
  const newScrambleBtn = document.getElementById('newScrambleBtn');
  const switchModeBtn = document.getElementById('switchModeBtn');

  const pbSingleEl = document.getElementById('pbSingle');
  const pbAo5El = document.getElementById('pbAo5');
  const pbAo12El = document.getElementById('pbAo12');
  const sessionNumberEl = document.getElementById('sessionNumber');
  const sessionCountEl = document.getElementById('sessionCount');
  const newSessionBtn = document.getElementById('newSessionBtn');

  const sidebarTimer = document.getElementById('sidebarTimer');
  const sidebarScores = document.getElementById('sidebarScores');
  const sessionsListEl = document.getElementById('sessionsList');
  const createSessionFromScoresBtn = document.getElementById('createSessionFromScores');
  const deleteSelectedSessionBtn = document.getElementById('deleteSelectedSession');

  const timerView = document.getElementById('timerView');
  const scoresView = document.getElementById('scoresView');

  const mainTimerEl = document.getElementById('mainTimer');

  const sessionDetails = document.getElementById('sessionDetails');
  const detailBest = document.getElementById('detailBest');
  const detailWorst = document.getElementById('detailWorst');
  const detailAvg = document.getElementById('detailAvg');
  const detailAo5 = document.getElementById('detailAo5');
  const detailAo12 = document.getElementById('detailAo12');
  const timesListEl = document.getElementById('timesList');
  const sessionMetaEl = document.getElementById('sessionMeta');

  const allocSelect = document.getElementById('allocSelect');
  const allocNewBtn = document.getElementById('allocNewBtn');
  const allocDeleteBtn = document.getElementById('allocDeleteBtn');
  const allocRenameInput = document.getElementById('allocRenameInput');
  const allocRenameBtn = document.getElementById('allocRenameBtn');

  const timerHiddenBtn = document.getElementById('timerHiddenBtn');

  let STATE = loadState();

  /* ---------- Timer state ---------- */
  let view = location.hash || '#timer';
  let timerMode = false;
  let timerState = 'idle'; // idle, holding, solving, finished
  let spaceDown = false;
  let holdStart = 0, holdInterval = null;
  let solveStart = 0, solveInterval = null;
  let lastElapsedMs = null;

  /* **IMPORTANT FIX**: declare timerHidden before any function that uses it */
  let timerHidden = false;

  /* selected session index in scores view */
  let selectedSessionIndex = null;
  let practiceVisible = false;

  /* ---------- Rendering ---------- */
  function renderAll(){
    STATE = loadState();
    renderAllocations();
    renderSidebar();
    renderMain();
  }
  function renderAllocations(){
    allocSelect.innerHTML = '';
    STATE.allocations.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.name;
      allocSelect.appendChild(opt);
    });
    const cur = getCurrentAllocation(STATE);
    if(cur) allocSelect.value = cur.id;
    allocDeleteBtn.disabled = STATE.allocations.length <= 1;
  }
  function renderSidebar(){
    STATE = loadState();
    const flat = allResultsFlattenedCurrentAllocation(STATE);
    pbSingleEl.textContent = bestSingle(flat) == null ? '—' : fmtTimeMs(bestSingle(flat));
    pbAo5El.textContent = bestAverage(flat,5) == null ? '—' : fmtTimeMs(bestAverage(flat,5));
    pbAo12El.textContent = bestAverage(flat,12) == null ? '—' : fmtTimeMs(bestAverage(flat,12));
    const curAlloc = getCurrentAllocation(STATE);
    const cur = getCurrentSession(STATE);
    sessionNumberEl.textContent = curAlloc ? String(curAlloc.sessions.length) : '—';
    sessionCountEl.textContent = cur && cur.results ? String(cur.results.length) : '0';
    newSessionBtn.disabled = !(cur && cur.results && cur.results.length>0);

    timerHiddenBtn.textContent = (timerHidden ? 'Timer: Hidden' : 'Timer: Shown');

    if(view === '#timer'){
      sidebarTimer.style.display = '';
      sidebarScores.style.display = 'none';
    } else {
      sidebarTimer.style.display = 'none';
      sidebarScores.style.display = '';
      renderSessionsList();
    }
  }
  function renderMain(){
    if(view === '#scores') practiceBar.style.display = 'none';
    else practiceBar.style.display = practiceVisible ? '' : 'none';

    if(view === '#timer'){
      timerView.style.display = '';
      scoresView.style.display = 'none';
    } else {
      timerView.style.display = 'none';
      scoresView.style.display = '';
      renderSelectedSessionDetails();
    }
//    timerBtn.classList.toggle('active', view === '#timer' || timerMode);
//    scoresBtn.classList.toggle('active', view === '#scores');

    switchModeBtn.textContent = scrambleMode === '2g' ? '2 Generator Mode' : 'Standard Mode';
  }

  /* ---------- Sessions list (per allocation) ---------- */
  function renderSessionsList(){
    STATE = loadState();
    sessionsListEl.innerHTML = '';
    const alloc = getCurrentAllocation(STATE);
    if(!alloc || !alloc.sessions.length){ sessionsListEl.textContent = 'No sessions'; selectedSessionIndex = null; return; }

    const pinned = alloc.sessions.map((s,i)=>({s,i})).filter(x=>x.s.pinned);
    const unpinned = alloc.sessions.map((s,i)=>({s,i})).filter(x=>!x.s.pinned);

    const appendItems = (arr, label) => {
      if(arr.length && label){
        const sep = document.createElement('div'); sep.style.fontSize='0.8rem'; sep.style.opacity='0.6'; sep.style.padding='4px 6px'; sep.textContent = label;
        sessionsListEl.appendChild(sep);
      }
      arr.forEach(obj => {
        const {s, i} = obj;
        const item = document.createElement('div');
        item.className = 'session-item' + ((selectedSessionIndex===i)?' selected':'');
        const left = document.createElement('div'); left.style.flex = '1';
        left.innerHTML = `<strong>Session ${i+1}</strong><br/><small>${s.results.length} results • ${new Date(s.createdAt).toLocaleString()}</small>`;
        const controls = document.createElement('div'); controls.className = 'session-controls';
        const pinBtn = document.createElement('button');
        pinBtn.className = 'btn'; pinBtn.style.fontSize = '0.85rem';
        pinBtn.textContent = s.pinned? 'Unpin' : 'Pin';
        pinBtn.title = 'Pin/unpin session';
        pinBtn.type = 'button';
        pinBtn.onclick = (ev)=>{ ev.stopPropagation(); STATE = loadState(); const alloc2 = getCurrentAllocation(STATE); alloc2.sessions[i].pinned = !alloc2.sessions[i].pinned; saveState(STATE); renderAll(); };
        controls.appendChild(pinBtn);
        item.appendChild(left); item.appendChild(controls);
        item.onclick = ()=>{ selectedSessionIndex = i; renderAll(); renderSessionsList(); };
        sessionsListEl.appendChild(item);
      });
    };

    appendItems(pinned, pinned.length ? 'Pinned' : '');
    appendItems(unpinned, unpinned.length ? 'Sessions' : '');
  }

  /* ---------- Session details view ---------- */
  function renderSelectedSessionDetails(){
    STATE = loadState();
    const alloc = getCurrentAllocation(STATE);
    if(!alloc || alloc.sessions.length === 0){ sessionMetaEl.textContent = 'No session'; detailBest.textContent='—'; detailWorst.textContent='—'; detailAvg.textContent='—'; detailAo5.textContent='—'; detailAo12.textContent='—'; timesListEl.innerHTML = ''; return; }
    if(selectedSessionIndex == null) selectedSessionIndex = alloc.sessions.length -1;
    if(selectedSessionIndex < 0) { selectedSessionIndex = null; renderMain(); return; }
    const sess = alloc.sessions[selectedSessionIndex];
    if(!sess){ sessionMetaEl.textContent = 'No session'; return; }
    sessionMetaEl.textContent = `#${selectedSessionIndex+1} • created ${new Date(sess.createdAt).toLocaleString()}`;

    const arrAll = (sess.results || []).map(r=>r.timeMs);
    if(arrAll.length === 0){
      detailBest.textContent='—'; detailWorst.textContent='—'; detailAvg.textContent='—'; detailAo5.textContent='—'; detailAo12.textContent='—';
      timesListEl.innerHTML = '<div style="color:rgba(191,207,224,0.6)">No results</div>'; return;
    }

    const best = Math.min(...arrAll);
    const worst = Math.max(...arrAll);
    const avg = Math.round(arrAll.reduce((a,b)=>a+b,0)/arrAll.length);
    detailBest.textContent = fmtTimeMs(best);
    detailWorst.textContent = fmtTimeMs(worst);
    detailAvg.textContent = fmtTimeMs(avg);
    const ao5 = bestAverage(arrAll,5);
    const ao12 = bestAverage(arrAll,12);
    detailAo5.textContent = ao5==null ? '—' : fmtTimeMs(ao5);
    detailAo12.textContent = ao12==null ? '—' : fmtTimeMs(ao12);

    timesListEl.innerHTML = '';
    sess.results.forEach((r, idx) => {
      const div = document.createElement('div'); div.className = 'time-item';
      div.innerHTML = `<div><strong>${fmtTimeMs(r.timeMs)}</strong><br/><small>${new Date(r.createdAt).toLocaleString()}</small></div>`;
      const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Del'; btn.onclick = (ev)=>{ ev.stopPropagation(); if(!confirm('Delete this time?')) return; STATE = loadState(); const a = getCurrentAllocation(STATE); if(!a) return; a.sessions[selectedSessionIndex].results.splice(idx,1); saveState(STATE); renderAll(); };
      div.appendChild(btn); timesListEl.appendChild(div);
    });
  }

  /* ---------- Hash / view handling ---------- */
  function applyHashMode() {
    const hash = location.hash || '#timer'; // domyślnie timer
    view = hash;  // <-- DODAJ TO

    navBtns.forEach(btn => btn.classList.remove('active'));

    document.querySelectorAll(`[data-hash="${hash}"]`).forEach(btn => {
        btn.classList.add('active');
    });

    renderAll();
    }

  window.addEventListener('hashchange', applyHashMode);
  if(!location.hash) location.hash = '#timer';
  applyHashMode();

  /* ---------- Allocation controls ---------- */
  allocNewBtn?.addEventListener('click', ()=>{
    STATE = loadState();
    const name = prompt('Allocation name', 'New Allocation') || 'New Allocation';
    createAllocation(STATE, name);
    renderAll();
  });
  allocDeleteBtn?.addEventListener('click', ()=>{
    STATE = loadState();
    const cur = getCurrentAllocation(STATE);
    if(!cur) return;
    if(!confirm('Delete allocation "' + cur.name + '"? This will remove its sessions.')) return;
    deleteAllocation(STATE, cur.id);
    renderAll();
  });
  allocSelect?.addEventListener('change', ()=>{
    const id = Number(allocSelect.value);
    STATE = loadState();
    setCurrentAllocation(STATE, id);
    selectedSessionIndex = null;
    renderAll();
  });
  allocRenameBtn?.addEventListener('click', ()=>{
    const newName = allocRenameInput.value && allocRenameInput.value.trim();
    if(!newName) return alert('Enter a name');
    STATE = loadState();
    const cur = getCurrentAllocation(STATE);
    if(!cur) return;
    renameAllocation(STATE, cur.id, newName);
    allocRenameInput.value = '';
    renderAll();
  });

  /* ---------- Sidebar controls (sessions) ---------- */
  newSessionBtn?.addEventListener('click', ()=>{
    STATE = loadState();
    const curAlloc = getCurrentAllocation(STATE);
    if(curAlloc && curAlloc.sessions && curAlloc.sessions.length>0){
      createSessionInCurrentAllocation(STATE);
      renderAll();
    } else {
      alert('Current allocation has no results — not creating new session.');
    }
  });
  createSessionFromScoresBtn?.addEventListener('click', ()=>{ STATE = loadState(); createSessionInCurrentAllocation(STATE); renderAll(); });
  deleteSelectedSessionBtn?.addEventListener('click', ()=>{
    STATE = loadState();
    const alloc = getCurrentAllocation(STATE);
    if(selectedSessionIndex == null || !alloc){ alert('No session selected'); return; }
    if(!confirm('Delete selected session?')) return;
    alloc.sessions.splice(selectedSessionIndex,1);
    if(selectedSessionIndex > alloc.sessions.length -1) selectedSessionIndex = alloc.sessions.length -1;
    if(alloc.sessions.length===0) selectedSessionIndex = null;
    saveState(STATE);
    renderAll();
  });

  /* ---------- Practice / Scramble controls ---------- */
  practiceBtn?.addEventListener('click', ()=>{
    practiceVisible = !practiceVisible;
    if(practiceVisible){ practiceBar.classList.remove('practice-hidden'); practiceScramble.textContent = generateScramble(); } else { practiceBar.classList.add('practice-hidden'); }
    renderMain();
  });
  newScrambleBtn?.addEventListener('click', ()=> practiceScramble.textContent = generateScramble());
  switchModeBtn?.addEventListener('click', ()=>{
    scrambleMode = scrambleMode === '2g' ? 'std' : '2g';
    switchModeBtn.textContent = scrambleMode === '2g' ? '2 Generator Mode' : 'Standard Mode';
    if(practiceVisible) practiceScramble.textContent = generateScramble();
  });

  /* ---------- Timer Hidden toggle (button) ---------- */
  timerHiddenBtn?.addEventListener('click', ()=>{
    timerHidden = !timerHidden;
    timerHiddenBtn.textContent = timerHidden ? 'Timer: Hidden' : 'Timer: Shown';
  });

  /* ---------- Timer logic ---------- */
  function isTimerActive(){ return (view === '#timer') || timerMode; }

  function resetTimerVisual(){
    timerState = 'idle';
    if(holdInterval){ clearInterval(holdInterval); holdInterval = null; }
    if(solveInterval){ clearInterval(solveInterval); solveInterval = null; }
    mainTimerEl.textContent = '0.00';
    spaceDown = false;
    lastElapsedMs = null;
  }
  resetTimerVisual();

  function updateHoldDisplay(){
    const ms = Date.now() - holdStart;
    mainTimerEl.textContent = (ms/1000).toFixed(2);
  }
  function updateSolveDisplay(){
    if(timerHidden){
      mainTimerEl.textContent = 'SOLVING';
    } else {
      const ms = Date.now() - solveStart;
      mainTimerEl.textContent = (ms/1000).toFixed(2);
    }
  }
  function stopSolvingAndCompute(){
    const elapsedMs = Date.now() - solveStart;
    lastElapsedMs = elapsedMs;
    mainTimerEl.textContent = (elapsedMs/1000).toFixed(2);
  }
  function saveResultAuto(){
    if(lastElapsedMs == null) return;
    STATE = loadState();
    let cur = getCurrentSession(STATE);
    if(!cur){
      cur = createSessionInCurrentAllocation(STATE);
    }
    cur.results.push({ timeMs: lastElapsedMs, createdAt: new Date().toISOString() });
    saveState(STATE);
    renderAll();
  }

  /* Intercept Space globally and blur active button to avoid accidental toggles */
  window.addEventListener('keydown', (e) => {
    if(e.code !== 'Space') return;
    const active = document.activeElement;
    if(active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
    e.preventDefault();
    if(active && (active.tagName === 'BUTTON' || active.tagName === 'A' || active.getAttribute('role') === 'button')) {
      try{ active.blur(); }catch(_){}
    }
    if(spaceDown) return;
    spaceDown = true;

    if(timerState === 'idle'){
    timerState = 'holding';
    holdStart = Date.now();
    updateHoldDisplay();
    holdInterval = setInterval(updateHoldDisplay, 50);

    } else if(timerState === 'solving'){
    if(solveInterval){ clearInterval(solveInterval); solveInterval = null; }
    stopSolvingAndCompute();
    timerState = 'finished';
    lastElapsedMs && saveResultAuto();

    } else if(timerState === 'finished'){
    resetTimerVisual();   // <-- TERAZ TU WKLEJASZ
    }
  });

  window.addEventListener('keyup', (e)=>{
    if(e.code !== 'Space') return;
    const active = document.activeElement;
    if(active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
    e.preventDefault();
    spaceDown = false;

    if(!isTimerActive()) return;

    if(timerState === 'holding'){
      if(holdInterval){ clearInterval(holdInterval); holdInterval = null; }
      timerState = 'solving';
      solveStart = Date.now();
      updateSolveDisplay();
      solveInterval = setInterval(updateSolveDisplay, 50);
    }
  });

  window.addEventListener('blur', ()=> resetTimerVisual());
  mainTimerEl?.addEventListener('mousedown', (e)=> e.preventDefault());

  /* nav buttons */
  timerBtn?.addEventListener('click', ()=>{
    timerMode = true;
    if(location.hash !== '#timer') location.hash = '#timer';
    applyHashMode();
  });
  scoresBtn?.addEventListener('click', ()=>{
    if(location.hash !== '#scores') location.hash = '#scores';
    applyHashMode();
  });

  /* initial render and state ensure */
  if(!STATE || !STATE.allocations || STATE.allocations.length===0){
    const alloc = { id: Date.now(), name: 'Default', sessions: [] };
    STATE = { allocations: [alloc], currentAllocationId: alloc.id };
    saveState(STATE);
  }
  renderAll();

  /* debug */
  window._rubik_alloc_state = loadState;
}

/* start after DOM ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/* global error logging to help debug if coś jeszcze się wydarzy */
window.addEventListener('error', e => console.error('Window error:', e.message, e.error));
window.addEventListener('unhandledrejection', e => console.error('Unhandled promise rejection', e.reason));
