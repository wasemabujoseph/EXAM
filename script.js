// Smart Exam Pro — upgraded
const els = {
  // sections
  studentSection: document.getElementById("student-section"),
  inputSection: document.getElementById("input-section"),
  examSection: document.getElementById("exam-section"),
  resultSection: document.getElementById("result-section"),
  main: document.getElementById("main"),
  live: document.getElementById("live"),
  // student
  studentName: document.getElementById("student-name"),
  studentId: document.getElementById("student-id"),
  continueBtn: document.getElementById("continue-btn"),
  resumeBtn: document.getElementById("resume-btn"),
  saveLocally: document.getElementById("save-locally"),
  // input
  mcqInput: document.getElementById("mcq-input"),
  fileInput: document.getElementById("file-input"),
  dropzone: document.getElementById("dropzone"),
  includeExplanations: document.getElementById("include-explanations"),
  generateBtn: document.getElementById("generate-btn"),
  demoBtn: document.getElementById("demo-btn"),
  clearInputBtn: document.getElementById("clear-input-btn"),
  // exam
  examForm: document.getElementById("exam-form"),
  submitBtn: document.getElementById("submit-btn"),
  cancelBtn: document.getElementById("cancel-btn"),
  progressFill: document.getElementById("progress-fill"),
  studentNameLive: document.getElementById("student-name-live"),
  examName: document.getElementById("exam-name"),
  examTitle: document.getElementById("exam-title"),
  passmarkBadge: document.getElementById("passmark"),
  timerBadge: document.getElementById("timer"),
  markReviewBtn: document.getElementById("mark-review-btn"),
  jumpPrevBtn: document.getElementById("jump-prev-btn"),
  jumpNextBtn: document.getElementById("jump-next-btn"),
  // results
  retryBtn: document.getElementById("retry-btn"),
  backBtn: document.getElementById("back-btn"),
  retestWrongBtn: document.getElementById("retest-wrong-btn"),
  reviewBtn: document.getElementById("review-btn"),
  scoreRing: document.getElementById("score-ring"),
  scorePercent: document.getElementById("score-percent"),
  studentNameResult: document.getElementById("student-name-result"),
  examNameResult: document.getElementById("exam-name-result"),
  qCount: document.getElementById("q-count"),
  qCorrect: document.getElementById("q-correct"),
  qWrong: document.getElementById("q-wrong"),
  qUnanswered: document.getElementById("q-unanswered"),
  scoreRaw: document.getElementById("score-raw"),
  statusPassFail: document.getElementById("status-passfail"),
  analysis: document.getElementById("analysis"),
  barCorrect: document.getElementById("bar-correct"),
  barWrong: document.getElementById("bar-wrong"),
  barUnanswered: document.getElementById("bar-unanswered"),
  // theme & app
  themeToggle: document.getElementById("theme-toggle"),
  appTitle: document.getElementById("app-title"),
  year: document.getElementById("year"),
  // settings
  settingsBtn: document.getElementById("settings-btn"),
  settingsDialog: document.getElementById("settings-dialog"),
  settingsForm: document.getElementById("settings-form"),
  setExamTitle: document.getElementById("setting-exam-title"),
  setDuration: document.getElementById("setting-duration"),
  setPassmark: document.getElementById("setting-passmark"),
  setNegative: document.getElementById("setting-negative"),
  setShuffleQuestions: document.getElementById("setting-shuffle-questions"),
  setShuffleOptions: document.getElementById("setting-shuffle-options"),
  setAutosave: document.getElementById("setting-autosave"),
  // import/export
  importBtn: document.getElementById("import-btn"),
  exportBtn: document.getElementById("export-btn"),
  importJson: document.getElementById("import-json")
};

// footer year
els.year.textContent = new Date().getFullYear();

// theme
const savedTheme = localStorage.getItem("sep-theme");
if (savedTheme === "dark") document.documentElement.classList.add("dark");
els.themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem(
    "sep-theme",
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
});

// preload student data
(function preloadStudent() {
  const saved = safeJSON(localStorage.getItem("sep-student")) || {};
  if (saved.name) els.studentName.value = saved.name;
  if (saved.id) els.studentId.value = saved.id;
})();

// App state
let mcqData = [];              // current exam questions (array of {id, question, options:[{k,v}], answer:'A', explanation})
let displayOrder = [];         // order of questions
let settings = loadSettings(); // user settings
let timer = { totalSec: 0, remaining: 0, tick: null };
let lastResults = null;        // last grading snapshot
let flagged = new Set();       // "mark for review"
let currentIndex = 0;          // focused question index

// Settings helpers
function loadSettings(){
  const s = safeJSON(localStorage.getItem("sep-settings")) || {};
  return {
    title: s.title || "Smart Exam Pro",
    durationMin: Number.isFinite(+s.durationMin) ? +s.durationMin : 0,
    passmark: Number.isFinite(+s.passmark) ? +s.passmark : 50,
    negative: Number.isFinite(+s.negative) ? +s.negative : 0.25,
    shuffleQ: s.shuffleQ !== undefined ? !!s.shuffleQ : true,
    shuffleO: s.shuffleO !== undefined ? !!s.shuffleO : true,
    autosave: s.autosave !== undefined ? !!s.autosave : true
  };
}
function saveSettings(){
  localStorage.setItem("sep-settings", JSON.stringify(settings));
  els.appTitle.textContent = settings.title || "Smart Exam Pro";
}

// Settings dialog wiring
els.appTitle.textContent = settings.title || "Smart Exam Pro";
els.settingsBtn.addEventListener("click", () => {
  els.setExamTitle.value = settings.title;
  els.setDuration.value = settings.durationMin;
  els.setPassmark.value = settings.passmark;
  els.setNegative.value = settings.negative;
  els.setShuffleQuestions.checked = settings.shuffleQ;
  els.setShuffleOptions.checked = settings.shuffleO;
  els.setAutosave.checked = settings.autosave;
  els.settingsDialog.showModal();
});
els.settingsForm.addEventListener("close", () => {/* no-op */});
els.settingsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // Only triggered via "Save" button (value="save")
});
els.settingsForm.addEventListener("click", (e) => {
  const val = e.target?.value;
  if (val === "save") {
    settings.title = els.setExamTitle.value.trim() || "Smart Exam Pro";
    settings.durationMin = clampInt(els.setDuration.value, 0, 10080);
    settings.passmark = clampInt(els.setPassmark.value, 0, 100);
    settings.negative = Math.max(0, Number(els.setNegative.value) || 0);
    settings.shuffleQ = !!els.setShuffleQuestions.checked;
    settings.shuffleO = !!els.setShuffleOptions.checked;
    settings.autosave = !!els.setAutosave.checked;
    saveSettings();
    announce("Settings saved");
    els.settingsDialog.close();
    refreshPassmarkBadge();
  }
  if (val === "cancel") {
    els.settingsDialog.close();
  }
});

// Resume button
els.resumeBtn.addEventListener("click", () => {
  const snapshot = safeJSON(localStorage.getItem("sep-snapshot"));
  if (!snapshot) { alert("No saved session found."); return; }
  applySnapshot(snapshot);
  announce("Session resumed");
});

// Continue to input
els.continueBtn.addEventListener("click", () => {
  const name = els.studentName.value.trim();
  if (!name) { alert("Please enter your full name."); return; }
  if (els.saveLocally.checked) {
    localStorage.setItem("sep-student", JSON.stringify({
      name, id: els.studentId.value.trim()
    }));
  }
  toggle(els.studentSection, false);
  toggle(els.inputSection, true);
  els.mcqInput.focus();
});

// Generate exam
els.generateBtn.addEventListener("click", () => {
  const src = els.mcqInput.value.trim();
  if (!src) { alert("Paste your MCQs first."); return; }
  const parsed = parseMCQs(src);
  if (!parsed.length) { alert("Could not parse MCQs. Please check the format."); return; }
  startExam(parsed);
});

// Demo content
els.demoBtn.addEventListener("click", () => {
  const demo = `Q1: Which tag creates a hyperlink in HTML?
A) <link>
B) <a>
C) <href>
D) <hyper>
Answer: B
Explanation: The <a> (anchor) tag defines a hyperlink.

Q2: In CSS, which property changes text color?
A) font-color
B) color
C) text-color
D) font-style
Answer: B
Explanation: The 'color' property sets the foreground text color.

Q3: Which HTTP method is idempotent?
A) POST
B) PATCH
C) PUT
D) CONNECT
Answer: C
Explanation: PUT is idempotent by definition; repeated requests yield the same effect.`;
  els.mcqInput.value = demo;
  announce("Demo questions loaded");
});

// Clear input
els.clearInputBtn.addEventListener("click", () => {
  els.mcqInput.value = "";
  announce("Input cleared");
});

// Dropzone upload
["dragover","dragenter"].forEach(ev => els.dropzone.addEventListener(ev, e => {
  e.preventDefault(); els.dropzone.style.borderColor = "var(--primary)";
}));
["dragleave","drop"].forEach(ev => els.dropzone.addEventListener(ev, e => {
  e.preventDefault(); els.dropzone.style.borderColor = "rgba(0,0,0,.15)";
}));
els.dropzone.addEventListener("drop", async (e) => {
  const file = e.dataTransfer.files?.[0];
  if (!file) return;
  const text = await file.text();
  els.mcqInput.value = text;
  announce(`Loaded ${file.name}`);
});
els.dropzone.addEventListener("click", () => els.fileInput.click());
els.dropzone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") els.fileInput.click(); });
els.fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  els.mcqInput.value = text;
  announce(`Loaded ${file.name}`);
});

// Exam navigation buttons
els.jumpPrevBtn.addEventListener("click", () => focusQuestion(currentIndex - 1));
els.jumpNextBtn.addEventListener("click", () => focusQuestion(currentIndex + 1));
els.markReviewBtn.addEventListener("click", () => {
  flagged.has(currentIndex) ? flagged.delete(currentIndex) : flagged.add(currentIndex);
  updateQuestionBadges();
});

// Cancel back to input
els.cancelBtn.addEventListener("click", () => {
  if (!confirm("Exit the exam and go back? Progress will be kept if autosave is enabled.")) return;
  stopTimer();
  toggle(els.examSection, false);
  toggle(els.inputSection, true);
});

// Submit
els.submitBtn.addEventListener("click", () => submitExam());

// Results actions
els.retryBtn.addEventListener("click", () => { if (mcqData.length) restartExamFull(); });
els.retestWrongBtn.addEventListener("click", () => retestWrong());
els.backBtn.addEventListener("click", () => {
  toggle(els.resultSection, false);
  toggle(els.inputSection, true);
});
els.reviewBtn.addEventListener("click", () => enterReviewMode());
document.getElementById("print-btn").addEventListener("click", () => window.print());
document.getElementById("download-csv-btn").addEventListener("click", () => downloadCSV());

// Import/Export JSON
els.exportBtn.addEventListener("click", () => {
  const payload = {
    meta: { title: settings.title, createdAt: Date.now() },
    questions: mcqData
  };
  downloadFile("exam.json", JSON.stringify(payload, null, 2), "application/json");
});
els.importBtn.addEventListener("click", () => els.importJson.click());
els.importJson.addEventListener("change", async (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  const text = await file.text();
  const payload = safeJSON(text);
  if (!payload?.questions?.length) { alert("Invalid exam JSON."); return; }
  startExam(payload.questions);
  if (payload.meta?.title) { settings.title = payload.meta.title; saveSettings(); }
  announce(`Imported ${file.name}`);
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Save
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    if (settings.autosave) snapshotSave();
    announce("Progress saved");
    return;
  }
  if (els.examSection.classList.contains("hidden")) return;
  const map = { "1":"A", "2":"B", "3":"C", "4":"D", "a":"A","b":"B","c":"C","d":"D" };
  if (map[e.key?.toLowerCase()]) {
    pickOption(currentIndex, map[e.key.toLowerCase()]);
  }
  if (e.key === "Enter") focusQuestion(currentIndex + 1);
  if (e.key === "ArrowLeft") focusQuestion(currentIndex - 1);
  if (e.key === "ArrowRight") focusQuestion(currentIndex + 1);
});

// Helpers
function toggle(el, show){ el.classList[show ? "remove" : "add"]("hidden"); }
function announce(msg){ els.live.textContent = msg; }
function clampInt(v, min, max){ v = parseInt(v,10); if (Number.isNaN(v)) v = min; return Math.min(max, Math.max(min, v)); }
function safeJSON(s){ try{ return JSON.parse(s); }catch{ return null; } }

// Snapshot (autosave)
function snapshotSave(){
  const answers = getAnswers();
  const snap = {
    version: 2,
    settings,
    student: { name: els.studentName.value.trim(), id: els.studentId.value.trim() },
    mcqData, displayOrder, answers, flagged: Array.from(flagged),
    timer: { remaining: timer.remaining, total: timer.totalSec },
    includeExplanations: els.includeExplanations.checked,
    currentIndex
  };
  localStorage.setItem("sep-snapshot", JSON.stringify(snap));
}
function applySnapshot(snap){
  settings = snap.settings || settings;
  saveSettings();
  els.studentName.value = snap.student?.name || "";
  els.studentId.value = snap.student?.id || "";
  els.includeExplanations.checked = !!snap.includeExplanations;
  mcqData = snap.mcqData || [];
  displayOrder = snap.displayOrder || mcqData.map((_, i) => i);
  flagged = new Set(snap.flagged || []);
  currentIndex = snap.currentIndex || 0;
  renderExam(mcqData, displayOrder, snap.answers || {});
  startTimer(snap.timer?.total || 0, snap.timer?.remaining || 0);
  els.studentNameLive.textContent = els.studentName.value.trim();
  toggle(els.studentSection, false);
  toggle(els.examSection, true);
}

// Start exam pipeline
function startExam(questions){
  // Normalize and stamp IDs
  mcqData = questions.map((q, idx) => normalizeQ(q, idx));
  displayOrder = mcqData.map((_, i) => i);
  if (settings.shuffleQ) shuffle(displayOrder);
  if (settings.shuffleO) mcqData.forEach(shuffleOptionsKeepAnswer);

  flagged.clear();
  currentIndex = 0;

  renderExam(mcqData, displayOrder);
  els.studentNameLive.textContent = els.studentName.value.trim();
  els.examName.textContent = settings.title || "Exam";
  refreshPassmarkBadge();

  // Timer
  const total = (settings.durationMin|0) * 60;
  startTimer(total);

  toggle(els.inputSection, false);
  toggle(els.examSection, true);

  if (settings.autosave) snapshotSave();
}

// Normalize
function normalizeQ(q, idx){
  // Accept old format or upgraded format
  const options = Array.isArray(q.options) ? q.options.slice() : [];
  const mapped = options.map(s => {
    // "A) Text" -> {k:'A', v:'Text'}
    const m = String(s).match(/^\s*([A-Da-d])\)\s*(.*)$/);
    return m ? { k: m[1].toUpperCase(), v: m[2] } : null;
  }).filter(Boolean);
  return {
    id: q.id ?? `q_${idx}_${Math.random().toString(36).slice(2,7)}`,
    question: String(q.question || "").trim(),
    options: mapped.length ? mapped : [
      {k:"A", v:"Option A"}, {k:"B", v:"Option B"}
    ],
    answer: String(q.answer || "").trim().toUpperCase(),
    explanation: String(q.explanation || "").trim()
  };
}

// Shuffle helpers
function shuffle(arr){ for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } }
function shuffleOptionsKeepAnswer(q){
  const idx = q.options.findIndex(o => o.k === q.answer);
  if (idx === -1) return;
  shuffle(q.options);
  // After shuffling, update q.answer to the new key at that correct option's value
  // Keep answer letter mapping by relettering options to A-D
  const letters = ["A","B","C","D","E","F"];
  q.options = q.options.map((o, i) => ({ k: letters[i], v: o.v }));
  // Find option with original correct text
  const correctText = (q.optionsRawCorrectText ?? q.options[idx]?.v) || q.options.find(o => o.v)?.v;
  const match = q.options.find(o => o.v === correctText);
  if (match) q.answer = match.k;
}

// Rendering exam
function renderExam(questions, order, prefilled = {}){
  els.examForm.innerHTML = "";
  updateProgress(0);

  (order || questions.map((_,i)=>i)).forEach((qi, i) => {
    const q = questions[qi];

    const wrap = document.createElement("fieldset");
    wrap.className = "question";
    wrap.id = `qwrap-${i}`;
    wrap.setAttribute("aria-labelledby", `qlab-${i}`);

    // Heading
    const legend = document.createElement("legend");
    legend.id = `qlab-${i}`;
    legend.innerHTML = `<strong>Q${i+1}:</strong> ${escapeHTML(q.question)}`;
    wrap.appendChild(legend);

    // Badges
    const badge = document.createElement("div");
    badge.className = "muted";
    badge.id = `qbadge-${i}`;
    wrap.appendChild(badge);

    // Options
    q.options.forEach(opt => {
      const letter = opt.k.toUpperCase();
      const id = `q${i}_${letter}`;

      const label = document.createElement("label");
      label.className = "opt";
      label.setAttribute("for", id);

      const input = document.createElement("input");
      input.id = id; input.type = "radio"; input.name = `q${i}`; input.value = letter;
      if (prefilled[`q${i}`] === letter) input.checked = true;

      label.appendChild(input);
      label.appendChild(document.createTextNode(` ${letter}) ${opt.v}`));
      wrap.appendChild(label);
    });

    els.examForm.appendChild(wrap);
  });

  // Progress update per change
  els.examForm.onchange = () => {
    const total = questions.length;
    const answered = Object.keys(getAnswers()).length;
    updateProgress(Math.round(answered / total * 100));
    if (settings.autosave) snapshotSave();
  };

  // First question focus
  focusQuestion(0);
  updateQuestionBadges();
}

function updateQuestionBadges(){
  const total = displayOrder.length;
  for (let i=0;i<total;i++){
    const badge = document.getElementById(`qbadge-${i}`);
    if (!badge) continue;
    const isFlagged = flagged.has(i);
    const ans = document.querySelector(`input[name="q${i}"]:checked`);
    let text = "";
    if (isFlagged) text += "⏭ Marked for review ";
    if (!ans) text += (text?"· ":"") + "Unanswered";
    badge.textContent = text;
  }
}

function focusQuestion(idx){
  const total = displayOrder.length;
  if (total === 0) return;
  if (idx < 0) idx = 0; if (idx > total-1) idx = total-1;
  currentIndex = idx;
  const wrap = document.getElementById(`qwrap-${idx}`);
  if (wrap) { wrap.scrollIntoView({behavior:"smooth", block:"center"}); wrap.focus({preventScroll:true}); }
  updateQuestionBadges();
}

function pickOption(idx, letter){
  const el = document.getElementById(`q${idx}_${letter}`);
  if (el){ el.checked = true; els.examForm.onchange(); }
}

// Submit & grade
function submitExam(){
  const answers = getAnswers();
  const results = [];
  let correct = 0, wrong = 0, unanswered = 0;

  displayOrder.forEach((qi, i) => {
    const q = mcqData[qi];
    const ans = answers[`q${i}`] || null;
    const isCorrect = ans === q.answer;
    if (ans === null) unanswered++;
    else if (isCorrect) correct++;
    else wrong++;

    results.push({
      index: i, question: q.question, options: q.options, answer: q.answer,
      selected: ans, isCorrect, explanation: q.explanation || ""
    });
  });

  lastResults = results;
  // Scoring with negative marking
  const neg = settings.negative || 0;
  const score = Math.max(0, correct - wrong * neg);
  const percent = Math.round((score / displayOrder.length) * 100);

  stopTimer();
  showResults(results, percent, { correct, wrong, unanswered, score });
  if (settings.autosave) snapshotSave();
}

function getAnswers(){
  const out = {};
  displayOrder.forEach((_, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    out[`q${i}`] = selected ? selected.value : null;
  });
  return out;
}

function restartExamFull(){
  document.querySelectorAll("input[type=radio]").forEach(r => r.checked = false);
  updateProgress(0);
  flagged.clear();
  startTimer((settings.durationMin|0)*60);
  toggle(els.resultSection, false);
  toggle(els.examSection, true);
  focusQuestion(0);
  updateQuestionBadges();
}

function retestWrong(){
  if (!lastResults) { alert("No previous results found."); return; }
  const wrongQs = lastResults.filter(r => !r.isCorrect);
  if (!wrongQs.length) { alert("Great job! No wrong answers to retest."); return; }

  // Build new mcqData from wrong ones
  mcqData = wrongQs.map((r, idx) => ({
    id: `re_${idx}_${Math.random().toString(36).slice(2,6)}`,
    question: r.question,
    options: r.options.map(o => ({k:o.k, v:o.v})),
    answer: r.answer,
    explanation: r.explanation || ""
  }));
  displayOrder = mcqData.map((_, i) => i);
  if (settings.shuffleQ) shuffle(displayOrder);
  if (settings.shuffleO) mcqData.forEach(shuffleOptionsKeepAnswer);

  renderExam(mcqData, displayOrder);
  els.studentNameLive.textContent = els.studentName.value.trim();
  updateProgress(0);
  startTimer((settings.durationMin|0)*60);
  toggle(els.resultSection, false);
  toggle(els.examSection, true);
}

// Progress
function updateProgress(val){ els.progressFill.style.width = `${val}%`; }

// Timer
function startTimer(totalSec, remaining=undefined){
  stopTimer();
  timer.totalSec = totalSec;
  timer.remaining = remaining !== undefined ? remaining : totalSec;
  updateTimerBadge();

  if (totalSec <= 0) { els.timerBadge.textContent = "No timer"; return; }

  // Prevent accidental pause via hidden tabs
  timer.tick = setInterval(() => {
    timer.remaining--;
    if (timer.remaining <= 0){
      stopTimer();
      alert("Time is up! Submitting your answers.");
      submitExam();
      return;
    }
    updateTimerBadge();
    if (settings.autosave && timer.remaining % 10 === 0) snapshotSave();
  }, 1000);

  document.addEventListener("visibilitychange", handleVisibility, { once: true });
}
function stopTimer(){
  if (timer.tick){ clearInterval(timer.tick); timer.tick = null; }
}
function handleVisibility(){
  // Keep counting even if hidden; no action needed, hook kept in case you want warnings.
}
function updateTimerBadge(){
  if (timer.totalSec <= 0){ els.timerBadge.textContent = "No timer"; return; }
  const m = Math.floor(timer.remaining/60).toString().padStart(2,"0");
  const s = (timer.remaining%60).toString().padStart(2,"0");
  els.timerBadge.textContent = `${m}:${s}`;
  if (timer.remaining <= 30){ els.timerBadge.style.background = "var(--danger)"; }
  else { els.timerBadge.style.background = "var(--badge)"; }
}

function refreshPassmarkBadge(){
  els.passmarkBadge.textContent = `Pass: ${settings.passmark}%`;
  els.examName.textContent = settings.title || "Exam";
  document.title = `${settings.title || "Smart Exam Pro"}`;
}

// Results rendering
function showResults(results, percent, meta){
  // Ring
  const deg = Math.round((percent / 100) * 360);
  els.scoreRing.style.background = `conic-gradient(var(--accent) ${deg}deg, var(--ring-bg) 0deg)`;
  els.scorePercent.textContent = `${percent}%`;

  // Meta
  els.studentNameResult.textContent = els.studentName.value.trim();
  els.examNameResult.textContent = settings.title || "Exam";
  const total = results.length;
  els.qCount.textContent = total;
  els.qCorrect.textContent = meta.correct;
  els.qWrong.textContent = meta.wrong;
  els.qUnanswered.textContent = meta.unanswered;
  els.scoreRaw.textContent = `${meta.correct} - ${meta.wrong}×${settings.negative} = ${meta.score.toFixed(2)}`;
  const passed = percent >= settings.passmark;
  els.statusPassFail.textContent = passed ? "✅ Passed" : "❌ Failed";
  els.statusPassFail.style.color = passed ? "var(--accent)" : "var(--danger)";

  // Bars
  const hUnit = 120; // px
  const hC = Math.round((meta.correct/total)*hUnit);
  const hW = Math.round((meta.wrong/total)*hUnit);
  const hU = Math.round((meta.unanswered/total)*hUnit);
  els.barCorrect.style.height = `${hC}px`;
  els.barWrong.style.height = `${hW}px`;
  els.barUnanswered.style.height = `${hU}px`;

  // Details
  els.analysis.innerHTML = "";
  results.forEach((r, i) => {
    const block = document.createElement("div");
    block.className = "question";

    const qp = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = `Q${i + 1}: `;
    qp.appendChild(strong);
    qp.appendChild(document.createTextNode(r.question));
    block.appendChild(qp);

    const ap = document.createElement("p");
    const your = `Your Answer: ${r.selected || "None"}`;
    const corr = `Correct Answer: ${r.answer}`;
    const mark = document.createElement("span");
    mark.className = r.isCorrect ? "result-correct" : "result-wrong";
    mark.textContent = r.isCorrect ? " ✔ Correct" : " ✘ Wrong";
    ap.appendChild(document.createTextNode(`${your}\n`));
    ap.appendChild(document.createTextNode(corr + " "));
    ap.appendChild(mark);
    block.appendChild(ap);

    if (els.includeExplanations.checked && r.explanation) {
      const ep = document.createElement("p");
      const eStrong = document.createElement("strong");
      eStrong.textContent = "Explanation: ";
      ep.appendChild(eStrong);
      ep.appendChild(document.createTextNode(r.explanation));
      block.appendChild(ep);
    }

    els.analysis.appendChild(block);
  });

  toggle(els.examSection, false);
  toggle(els.resultSection, true);
}

// Review mode (show correct option inline)
function enterReviewMode(){
  toggle(els.resultSection, false);
  toggle(els.examSection, true);

  // Disable inputs and indicate correct choices
  displayOrder.forEach((qi, i) => {
    const q = mcqData[qi];
    const radios = document.querySelectorAll(`input[name="q${i}"]`);
    radios.forEach(r => { r.disabled = true; });

    const correctId = `q${i}_${q.answer}`;
    const correctInput = document.getElementById(correctId);
    if (correctInput){
      const label = correctInput.closest("label");
      if (label) label.style.outline = "2px solid var(--accent)";
    }
  });
}

// CSV download
function downloadCSV(){
  if (!lastResults?.length){ alert("No results to download yet."); return; }
  const rows = [
    ["Student", els.studentName.value.trim()],
    ["Exam", settings.title || "Exam"],
    [],
    ["#","Question","Selected","Correct","IsCorrect","Explanation"]
  ];
  lastResults.forEach((r,i)=>{
    rows.push([
      i+1, r.question.replace(/\n/g," "), r.selected||"", r.answer, r.isCorrect ? "TRUE":"FALSE",
      (r.explanation||"").replace(/\n/g," ")
    ]);
  });
  const csv = rows.map(r => r.map(escapeCSV).join(",")).join("\n");
  downloadFile("results.csv", csv, "text/csv");
}

function escapeCSV(cell){
  const needs = /[",\n]/.test(cell);
  return needs ? `"${cell.replace(/"/g,'""')}"` : cell;
}
function downloadFile(name, content, type){
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

// Parser
function parseMCQs(text){
  const lines = text.split(/\r?\n/);
  const qs = [];
  let cur = emptyQ();
  let inExp = false;

  for (let raw of lines){
    const line = raw.trim();
    if (!line) continue;

    const qMatch = line.match(/^Q(\d+):\s*(.*)$/i);
    if (qMatch){
      // push previous
      if (cur.question) { qs.push({...cur}); cur = emptyQ(); inExp = false; }
      cur.question = qMatch[2];
      continue;
    }
    const optMatch = line.match(/^([A-Da-d])\)\s*(.*)$/);
    if (optMatch){
      cur.options.push(`${optMatch[1].toUpperCase()}) ${optMatch[2]}`);
      inExp = false;
      continue;
    }
    const ansMatch = line.match(/^Answer:\s*([A-Da-d])\s*$/i);
    if (ansMatch){
      cur.answer = ansMatch[1].toUpperCase();
      inExp = false;
      continue;
    }
    const expMatch = line.match(/^Explanation:\s*(.*)$/i);
    if (expMatch){
      cur.explanation = expMatch[1];
      inExp = true;
      continue;
    }
    if (inExp){
      cur.explanation += (cur.explanation ? " " : "") + line;
    }
  }
  if (cur.question) qs.push(cur);

  // Basic validation
  const cleaned = qs
    .map((q, idx) => normalizeQ(q, idx))
    .filter(q => q.question && q.options.length >= 2 && /[A-D]/.test(q.answer));
  return cleaned;
}
function emptyQ(){ return { question:"", options:[], answer:"", explanation:"" }; }

// Escape HTML for safe rendering
function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Misc
function updateQuestionCountBadge(){ /* kept for future */ }
function updateExamTitle(){ els.examTitle.firstChild.nodeValue = "📚 "; }

function updateProgressFromForm(){
  const total = displayOrder.length;
  const answered = Object.keys(getAnswers()).length;
  updateProgress(Math.round(answered / total * 100));
}

// Passmark badge already updated by refreshPassmarkBadge()

// Timer-safe beforeunload warning when in exam
window.addEventListener("beforeunload", (e) => {
  if (!els.examSection.classList.contains("hidden")){
    if (settings.autosave) snapshotSave();
    e.preventDefault();
    e.returnValue = "";
  }
});

// Utility: start exam at resume
function applyAnswers(prefilled){
  Object.entries(prefilled).forEach(([k,v])=>{
    const el = document.querySelector(`input[name="${k}"][value="${v}"]`);
    if (el) el.checked = true;
  });
  updateProgressFromForm();
}

// Start/Resume snapshot integration (used inside applySnapshot)
function startTimerResume(){ /* handled by startTimer(...) already */ }

// Passmark & Title at load
refreshPassmarkBadge();

// Save student on change if preference checked
[els.studentName, els.studentId].forEach(inp => inp.addEventListener("change", ()=>{
  if (!els.saveLocally.checked) return;
  localStorage.setItem("sep-student", JSON.stringify({
    name: els.studentName.value.trim(),
    id: els.studentId.value.trim()
  }));
}));

// =====================
// End of main script
// =====================
