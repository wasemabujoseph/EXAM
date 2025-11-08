/* Smart Exam Pro — GitHub Pages + Saved Exams
   - Load remote exams from /exams/index.json and /exams/<file>
   - Save exams locally (localStorage) so users can redo them anytime
   - Deep links:
       ?exam=<id>   -> remote (from /exams)
       ?saved=<id>  -> local (this device)
   - One-time vs Saved flow via buttons
*/

const els = {
  // tabs
  tabs: Array.from(document.querySelectorAll('.tab')),
  panels: {
    load: document.getElementById('tab-load'),
    saved: document.getElementById('tab-saved'),
    paste: document.getElementById('tab-paste')
  },

  // load from repo
  examSelect: document.getElementById('examSelect'),
  btnLoadOneTime: document.getElementById('btnLoadOneTime'),
  btnLoadAndSave: document.getElementById('btnLoadAndSave'),
  btnCopyRemoteLink: document.getElementById('btnCopyRemoteLink'),

  // saved exams
  savedList: document.getElementById('savedList'),
  btnExportAll: document.getElementById('btnExportAll'),
  fileImport: document.getElementById('fileImport'),
  btnClearAll: document.getElementById('btnClearAll'),

  // paste
  pasteInput: document.getElementById('pasteInput'),
  pasteTitle: document.getElementById('pasteTitle'),
  pasteId: document.getElementById('pasteId'),
  btnPasteOneTime: document.getElementById('btnPasteOneTime'),
  btnPasteSave: document.getElementById('btnPasteSave'),

  // student
  studentName: document.getElementById('studentName'),
  studentId: document.getElementById('studentId'),

  // exam UI
  examMeta: document.getElementById('examMeta'),
  examTitle: document.getElementById('examTitle'),
  examDesc: document.getElementById('examDesc'),
  btnCopySavedLink: document.getElementById('btnCopySavedLink'),
  btnForgetSaved: document.getElementById('btnForgetSaved'),
  examContainer: document.getElementById('examContainer'),
  actions: document.getElementById('actions'),
  submitBtn: document.getElementById('submitBtn'),
  retestBtn: document.getElementById('retestBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  resetBtn: document.getElementById('resetBtn'),

  // results
  results: document.getElementById('results'),
  scoreRing: document.getElementById('scoreRing'),
  scoreText: document.getElementById('scoreText'),
  percentText: document.getElementById('percentText'),
  breakdown: document.getElementById('breakdown'),
};

const KEYS = {
  student: 'sep-student',
  savedIndex: 'sep-saved-index',      // array of {id,title,description,count,createdAt}
  savedExam: (id) => `sep-exam-${id}`,// exam JSON by id
  resultsLog: 'sep-results',          // global log of attempts
  lastResult: (id) => `sep-last-${id}`// last result per saved exam
};

const STATE = {
  examsIndex: null, // remote index.json
  exam: null,       // current exam object
  answers: [],
  subsetMode: false,
  savedIdInUse: null // if current exam is a "saved" one, this is its id
};

init().catch(console.error);

/* ------------------ Init ------------------ */
async function init(){
  // Tabs
  els.tabs.forEach(btn => btn.addEventListener('click', onTabClick));

  // Load student info
  hydrateStudent();

  // Load remote exam index
  await loadExamsIndex();

  // Bind buttons
  els.btnLoadOneTime.addEventListener('click', () => startRemote(false));
  els.btnLoadAndSave.addEventListener('click', () => startRemote(true));
  els.btnCopyRemoteLink.addEventListener('click', copyRemoteLink);

  els.btnPasteOneTime.addEventListener('click', () => startPasted(false));
  els.btnPasteSave.addEventListener('click', () => startPasted(true));

  els.btnExportAll.addEventListener('click', exportAllSaved);
  els.fileImport.addEventListener('change', importSavedFromFile);
  els.btnClearAll.addEventListener('click', clearAllSaved);

  els.submitBtn.addEventListener('click', onSubmit);
  els.retestBtn.addEventListener('click', onRetestWrongOnly);
  els.downloadBtn.addEventListener('click', onDownloadResults);
  els.resetBtn.addEventListener('click', resetAll);
  els.btnCopySavedLink.addEventListener('click', copySavedLink);
  els.btnForgetSaved.addEventListener('click', forgetCurrentSaved);

  // Render saved list
  renderSavedList();

  // Deep links
  const url = new URL(location.href);
  const savedId = url.searchParams.get('saved');
  const remoteId = url.searchParams.get('exam');
  if(savedId){
    try { await loadSavedExam(savedId); } catch(e){ alert(e.message); }
  }else if(remoteId){
    setSelectByValue(els.examSelect, remoteId);
    // start one-time by default on deep link; user can choose to save
    await loadSelectedRemote(remoteId);
  }
}

/* ------------------ Tabs ------------------ */
function onTabClick(e){
  els.tabs.forEach(b => b.classList.remove('active'));
  e.currentTarget.classList.add('active');

  const tab = e.currentTarget.dataset.tab;
  Object.entries(els.panels).forEach(([k, el]) => {
    el.classList.toggle('hidden', k !== tab);
  });
}

/* ------------------ Student Info ------------------ */
function hydrateStudent(){
  try{
    const saved = JSON.parse(localStorage.getItem(KEYS.student)||'{}');
    if(saved.name) els.studentName.value = saved.name;
    if(saved.id) els.studentId.value = saved.id;
  }catch(_){}
}
function persistStudent(){
  const name = els.studentName.value.trim();
  const id = els.studentId.value.trim();
  localStorage.setItem(KEYS.student, JSON.stringify({name,id}));
}

/* ------------------ Remote Exams ------------------ */
async function loadExamsIndex(){
  try{
    const res = await fetch('./exams/index.json', {cache:'no-store'});
    if(!res.ok) throw new Error('Cannot load exams/index.json');
    const data = await res.json();
    STATE.examsIndex = data;
    els.examSelect.innerHTML = '';
    (data.exams||[]).forEach(ex => {
      const opt = document.createElement('option');
      opt.value = ex.id;
      opt.textContent = `${ex.title} (${ex.id})`;
      els.examSelect.appendChild(opt);
    });
  }catch(err){
    console.error(err);
    els.examSelect.innerHTML = `<option value="">Failed to load exams/index.json</option>`;
  }
}
function copyRemoteLink(){
  const id = els.examSelect.value;
  if(!id){ alert('Select an exam first.'); return; }
  const url = new URL(location.href);
  url.searchParams.set('exam', id);
  navigator.clipboard.writeText(url.href).then(
    () => alert('Remote deep link copied!'),
    () => alert('Copy failed. Here it is:\n'+url.href)
  );
}
async function startRemote(saveFirst){
  const id = els.examSelect.value;
  if(!id){ alert('Select an exam first.'); return; }
  await loadSelectedRemote(id, saveFirst);
}
async function loadSelectedRemote(id, saveFirst=false){
  const meta = (STATE.examsIndex?.exams||[]).find(e => e.id === id);
  if(!meta){ alert('Exam not found in index.'); return; }
  const res = await fetch(`./exams/${meta.file}`, {cache:'no-store'});
  if(!res.ok){ alert('Failed to load exam JSON.'); return; }
  const exam = await res.json();
  exam.id = exam.id || id;
  exam.title = exam.title || meta.title || id;
  exam.description = exam.description || meta.description || '';
  normalizeExam(exam);

  if(saveFirst){
    const savedId = saveExamLocal(exam, exam.id);
    await loadSavedExam(savedId); // switch to saved flow
  }else{
    startExam(exam, null);
  }
}

/* ------------------ Paste Flow ------------------ */
function startPasted(saveFirst){
  const raw = els.pasteInput.value.trim();
  const title = (els.pasteTitle.value.trim() || 'Pasted Exam');
  const customId = slugify(els.pasteId.value.trim());

  const questions = parsePasted(raw);
  if(!questions.length){ alert('Could not parse any questions.'); return; }

  const exam = { id: customId || undefined, title, description:'Parsed from pasted text', questions };
  normalizeExam(exam);

  if(saveFirst){
    const savedId = saveExamLocal(exam, exam.id);
    loadSavedExam(savedId);
  }else{
    startExam(exam, null);
  }
}
function parsePasted(raw){
  if(!raw) return [];
  const blocks = raw.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const out = [];
  for(const block of blocks){
    const lines = block.split('\n').map(l => l.trim());
    const qLine = lines.find(l => /^Q(\d+|#)?:/i.test(l)) || lines[0];
    const opts = lines.filter(l => /^[A-E]\)/i.test(l));
    const ansLine = lines.find(l => /^Answer\s*:/i.test(l)) || '';
    const expLine = lines.find(l => /^Explanation\s*:/i.test(l)) || '';

    const qText = (qLine || '').replace(/^Q(\d+|#)?:/i,'').replace(/^[:\-]\s*/,'').trim();
    const options = opts.map(o => o.replace(/^[A-E]\)\s*/i,'').trim());
    const ansLetter = (ansLine.split(':')[1]||'').trim().toUpperCase().slice(0,1);
    const map = {A:0,B:1,C:2,D:3,E:4};
    const answer = map[ansLetter];
    const explanation = (expLine.split(':')[1]||'').trim();

    if(qText && options.length && (answer!=null)){
      out.push({text:qText, options, answer, explanation});
    }
  }
  return out;
}

/* ------------------ Saved Exams (localStorage) ------------------ */
function getSavedIndex(){
  try{ return JSON.parse(localStorage.getItem(KEYS.savedIndex)||'[]'); }
  catch(_){ return []; }
}
function setSavedIndex(list){
  localStorage.setItem(KEYS.savedIndex, JSON.stringify(list));
}
function saveExamLocal(exam, preferredId){
  const idx = getSavedIndex();
  const id = uniqueId(preferredId || slugify(exam.title) || 'exam', idx.map(x=>x.id));
  const stored = {
    id,
    title: exam.title || id,
    description: exam.description || '',
    questions: exam.questions
  };
  localStorage.setItem(KEYS.savedExam(id), JSON.stringify(stored));

  const meta = {id, title: stored.title, description: stored.description, count: stored.questions.length, createdAt: new Date().toISOString()};
  idx.push(meta);
  setSavedIndex(idx);
  renderSavedList();
  return id;
}
async function loadSavedExam(id){
  const raw = localStorage.getItem(KEYS.savedExam(id));
  if(!raw) throw new Error('Saved exam not found on this device.');
  const exam = JSON.parse(raw);
  normalizeExam(exam);
  startExam(exam, id);
  // switch to "Saved" tab for clarity
  switchTab('saved');
}
function renderSavedList(){
  const idx = getSavedIndex();
  els.savedList.innerHTML = '';
  if(!idx.length){
    els.savedList.innerHTML = `<div class="muted">No saved exams yet. Save from “Load From Repo” or “Paste MCQs”.</div>`;
    return;
  }
  idx.forEach(meta => {
    const card = document.createElement('div');
    card.className = 'saved-card';
    const desc = meta.description ? ` — ${escapeHTML(meta.description)}` : '';
    card.innerHTML = `
      <div><strong>${escapeHTML(meta.title)}</strong>${desc}</div>
      <div class="small muted">ID: <code>${meta.id}</code> • ${meta.count} questions • Saved: ${new Date(meta.createdAt).toLocaleString()}</div>
      <div class="saved-actions">
        <button data-act="start" data-id="${meta.id}" class="primary">Start</button>
        <button data-act="copy" data-id="${meta.id}">Copy Link</button>
        <button data-act="export" data-id="${meta.id}">Export</button>
        <button data-act="delete" data-id="${meta.id}">Delete</button>
      </div>
    `;
    card.querySelector('.saved-actions').addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      const act = btn.getAttribute('data-act');
      const id = btn.getAttribute('data-id');
      if(act==='start') loadSavedExam(id).catch(err=>alert(err.message));
      if(act==='copy') copySavedLinkRaw(id);
      if(act==='export') exportOneSaved(id);
      if(act==='delete') deleteOneSaved(id);
    });
    els.savedList.appendChild(card);
  });
}
function deleteOneSaved(id){
  const idx = getSavedIndex().filter(x => x.id !== id);
  localStorage.removeItem(KEYS.savedExam(id));
  localStorage.removeItem(KEYS.lastResult(id));
  setSavedIndex(idx);
  renderSavedList();
}
function exportOneSaved(id){
  const raw = localStorage.getItem(KEYS.savedExam(id));
  if(!raw){ alert('Saved exam not found.'); return; }
  downloadBlob(raw, `saved-exam-${id}.json`, 'application/json');
}
function exportAllSaved(){
  const idx = getSavedIndex();
  const out = {};
  idx.forEach(m => {
    const raw = localStorage.getItem(KEYS.savedExam(m.id));
    if(raw) out[m.id] = JSON.parse(raw);
  });
  downloadBlob(JSON.stringify(out, null, 2), 'saved-exams-export.json', 'application/json');
}
function importSavedFromFile(e){
  const file = e.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(Array.isArray(data)){ // legacy array
        data.forEach(obj => {
          normalizeExam(obj);
          saveExamLocal(obj, obj.id);
        });
      }else if(typeof data === 'object'){
        Object.values(data).forEach(obj => {
          normalizeExam(obj);
          saveExamLocal(obj, obj.id);
        });
      }
      alert('Import complete.');
      renderSavedList();
    }catch(err){
      alert('Import failed: ' + err.message);
    }finally{
      e.target.value = '';
    }
  };
  reader.readAsText(file);
}
function clearAllSaved(){
  if(!confirm('Delete ALL saved exams on this device?')) return;
  const idx = getSavedIndex();
  idx.forEach(m => {
    localStorage.removeItem(KEYS.savedExam(m.id));
    localStorage.removeItem(KEYS.lastResult(m.id));
  });
  setSavedIndex([]);
  renderSavedList();
}

/* ------------------ Exam Runtime ------------------ */
function normalizeExam(exam){
  exam.questions = (exam.questions||[]).map(q => {
    const out = {
      text: (q.text||'').toString(),
      options: Array.isArray(q.options) ? q.options.map(o=>o.toString()) : [],
      explanation: (q.explanation||'').toString()
    };
    if(typeof q.answer === 'number'){
      out.answer = q.answer;
    }else if(typeof q.answer === 'string'){
      const m = {A:0,B:1,C:2,D:3,E:4};
      out.answer = m[q.answer.trim().toUpperCase()] ?? null;
    }else{
      out.answer = null;
    }
    return out;
  });
}
function startExam(exam, savedId){
  STATE.exam = exam;
  STATE.savedIdInUse = savedId || null;
  STATE.subsetMode = false;
  STATE.answers = Array(exam.questions.length).fill(null);

  // Meta
  els.examMeta.classList.remove('hidden');
  els.examTitle.textContent = exam.title || 'Exam';
  els.examDesc.textContent = exam.description || '';
  els.btnCopySavedLink.classList.toggle('hidden', !STATE.savedIdInUse);
  els.btnForgetSaved.classList.toggle('hidden', !STATE.savedIdInUse);

  // Body
  renderExam();
  els.actions.classList.remove('hidden');
  els.retestBtn.disabled = true;
  els.downloadBtn.disabled = true;
  els.results.classList.add('hidden');

  // Save student info asap
  persistStudent();

  // Scroll
  document.getElementById('examMeta').scrollIntoView({behavior:'smooth', block:'start'});
}
function renderExam(){
  const box = els.examContainer;
  box.innerHTML = '';
  box.classList.remove('hidden');

  STATE.exam.questions.forEach((q, qi) => {
    const card = document.createElement('div');
    card.className = 'question';
    const h = document.createElement('h3');
    h.textContent = `Q${qi+1}: ${q.text}`;
    card.appendChild(h);

    const opts = document.createElement('div');
    opts.className = 'options';
    q.options.forEach((opt, oi) => {
      const id = `q${qi}-o${oi}`;
      const wrap = document.createElement('label');
      wrap.className = 'option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q-${qi}`;
      input.id = id;
      input.value = String(oi);
      input.addEventListener('change', () => { STATE.answers[qi] = oi; });
      const text = document.createElement('span');
      text.textContent = `${String.fromCharCode(65+oi)}) ${opt}`;
      wrap.appendChild(input);
      wrap.appendChild(text);
      opts.appendChild(wrap);
    });
    card.appendChild(opts);
    box.appendChild(card);
  });
}
function onSubmit(){
  persistStudent();

  const total = STATE.exam.questions.length;
  let correct = 0;
  const detail = [];
  const qCards = Array.from(els.examContainer.querySelectorAll('.question'));

  STATE.exam.questions.forEach((q, qi) => {
    const a = STATE.answers[qi];
    const ok = (a === q.answer);
    if(ok) correct++;
    detail.push({
      question: q.text,
      selected: a,
      correct: q.answer,
      options: q.options.slice(),
      explanation: q.explanation || '',
      isCorrect: ok
    });

    // visuals
    const opts = qCards[qi].querySelectorAll('.option');
    opts.forEach((el, oi) => {
      el.classList.remove('correct','wrong');
      if(oi === q.answer) el.classList.add('correct');
      if(a !== null && oi === a && a !== q.answer) el.classList.add('wrong');
    });
  });

  const percent = total ? Math.round((correct/total)*100) : 0;
  updateScoreUI(correct, total, percent);
  renderBreakdown(detail);
  els.retestBtn.disabled = (correct === total);
  els.downloadBtn.disabled = false;
  els.results.classList.remove('hidden');

  // Persist global log
  const payload = {
    ts: new Date().toISOString(),
    examId: STATE.exam.id || null,
    savedId: STATE.savedIdInUse,
    title: STATE.exam.title,
    student: {
      name: els.studentName.value.trim() || null,
      id: els.studentId.value.trim() || null
    },
    correct, total, percent, detail
  };
  try{
    const prev = JSON.parse(localStorage.getItem(KEYS.resultsLog)||'[]');
    prev.push(payload);
    localStorage.setItem(KEYS.resultsLog, JSON.stringify(prev));
  }catch(_){}

  // Persist last result per saved exam (handy to show later if needed)
  if(STATE.savedIdInUse){
    localStorage.setItem(KEYS.lastResult(STATE.savedIdInUse), JSON.stringify(payload));
  }
}
function updateScoreUI(correct, total, percent){
  els.scoreText.textContent = `${correct} / ${total}`;
  els.percentText.textContent = `${percent}%`;
  const deg = Math.round(360*(percent/100));
  els.scoreRing.style.background = `conic-gradient(var(--accent) 0deg, var(--accent) ${deg}deg, #262b3a ${deg}deg 360deg)`;
}
function renderBreakdown(detail){
  els.breakdown.innerHTML = '';
  detail.forEach((d,i)=>{
    const wrap = document.createElement('div');
    wrap.className = 'breakdown-item';
    const status = d.isCorrect ? `<span class="badge ok">Correct</span>` : `<span class="badge bad">Wrong</span>`;
    const sel = d.selected==null ? '—' : String.fromCharCode(65+d.selected);
    const cor = d.correct==null ? '—' : String.fromCharCode(65+d.correct);
    wrap.innerHTML = `
      <div><strong>Q${i+1}:</strong> ${escapeHTML(d.question)} ${status}</div>
      <div class="small muted">Selected: ${sel} • Correct: ${cor}</div>
      ${d.explanation ? `<div class="small">Explanation: ${escapeHTML(d.explanation)}</div>` : ``}
    `;
    els.breakdown.appendChild(wrap);
  });
}
function onRetestWrongOnly(){
  const wrong = [];
  STATE.exam.questions.forEach((q, qi) => {
    if(STATE.answers[qi] !== q.answer){
      wrong.push(q);
    }
  });
  if(!wrong.length){ alert('No wrong questions to retest.'); return; }
  STATE.exam = {
    id: (STATE.exam.id||'exam')+'-retest',
    title: (STATE.exam.title||'Exam')+' — Retest Wrong Only',
    description: 'Subset of the questions you missed.',
    questions: wrong
  };
  STATE.subsetMode = true;
  STATE.answers = Array(STATE.exam.questions.length).fill(null);
  startExam(STATE.exam, STATE.savedIdInUse); // keep saved id if originally from saved
}
function onDownloadResults(){
  const log = JSON.parse(localStorage.getItem(KEYS.resultsLog)||'[]');
  const last = log[log.length-1];
  if(!last){ alert('No results to download yet.'); return; }
  const base = last.savedId ? `saved-${last.savedId}` : (last.examId||'exam');
  const fname = `results-${base}-${last.ts.replace(/[:.]/g,'-')}.json`;
  downloadBlob(JSON.stringify(last, null, 2), fname, 'application/json');
}
function resetAll(){
  STATE.exam = null;
  STATE.answers = [];
  STATE.savedIdInUse = null;
  els.examMeta.classList.add('hidden');
  els.examContainer.classList.add('hidden');
  els.actions.classList.add('hidden');
  els.results.classList.add('hidden');
}

/* ------------------ Saved Exam Controls (current) ------------------ */
function copySavedLink(){
  if(!STATE.savedIdInUse) return;
  copySavedLinkRaw(STATE.savedIdInUse);
}
function copySavedLinkRaw(id){
  const url = new URL(location.href);
  url.searchParams.delete('exam');
  url.searchParams.set('saved', id);
  navigator.clipboard.writeText(url.href).then(
    () => alert('Saved deep link copied! (works on this device)'),
    () => alert('Copy failed. Here it is:\n'+url.href)
  );
}
function forgetCurrentSaved(){
  if(!STATE.savedIdInUse) return;
  if(!confirm('Delete this saved exam from this device?')) return;
  deleteOneSaved(STATE.savedIdInUse);
  resetAll();
}

/* ------------------ Helpers ------------------ */
function setSelectByValue(sel, val){
  const i = Array.from(sel.options).findIndex(o => o.value === val);
  if(i>=0) sel.selectedIndex = i;
}
function slugify(s){
  return (s||'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}
function uniqueId(base, existing){
  let id = slugify(base||'exam') || 'exam';
  if(!existing.includes(id)) return id;
  let i = 2;
  while(existing.includes(`${id}-${i}`)) i++;
  return `${id}-${i}`;
}
function escapeHTML(s){
  return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function downloadBlob(text, filename, type){
  const blob = new Blob([text], {type});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
function switchTab(name){
  els.tabs.forEach(b => b.classList.toggle('active', b.dataset.tab===name));
  Object.entries(els.panels).forEach(([k, el]) => {
    el.classList.toggle('hidden', k !== name);
  });
}
