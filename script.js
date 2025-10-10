// Smart Exam Pro — Enhanced (timer, shuffle, navigator, flags, autosave, PWA)

const els = {
  // sections
  studentSection: document.getElementById("student-section"),
  inputSection: document.getElementById("input-section"),
  examSection: document.getElementById("exam-section"),
  resultSection: document.getElementById("result-section"),
  main: document.getElementById("main"),
  // student
  studentName: document.getElementById("student-name"),
  studentId: document.getElementById("student-id"),
  examMinutes: document.getElementById("exam-minutes"),
  rememberDevice: document.getElementById("remember-device"),
  shuffleQuestionsToggle: document.getElementById("toggle-shuffle-questions"),
  shuffleOptionsToggle: document.getElementById("toggle-shuffle-options"),
  continueBtn: document.getElementById("continue-btn"),
  // input
  mcqInput: document.getElementById("mcq-input"),
  generateBtn: document.getElementById("generate-btn"),
  clearInputBtn: document.getElementById("clear-input-btn"),
  fileInput: document.getElementById("file-input"),
  loadFileBtn: document.getElementById("load-file-btn"),
  // exam
  examForm: document.getElementById("exam-form"),
  submitBtn: document.getElementById("submit-btn"),
  cancelBtn: document.getElementById("cancel-btn"),
  progressFill: document.getElementById("progress-fill"),
  progressText: document.getElementById("progress-text"),
  studentNameLive: document.getElementById("student-name-live"),
  timer: document.getElementById("timer"),
  navPanel: document.getElementById("nav-panel"),
  // results
  retryBtn: document.getElementById("retry-btn"),
  backBtn: document.getElementById("back-btn"),
  retestWrongBtn: document.getElementById("retest-wrong-btn"),
  retestFlaggedBtn: document.getElementById("retest-flagged-btn"),
  scoreRing: document.getElementById("score-ring"),
  scorePercent: document.getElementById("score-percent"),
  studentNameResult: document.getElementById("student-name-result"),
  qCount: document.getElementById("q-count"),
  qCorrect: document.getElementById("q-correct"),
  qWrong: document.getElementById("q-wrong"),
  qFlagged: document.getElementById("q-flagged"),
  timeUsed: document.getElementById("time-used"),
  analysis: document.getElementById("analysis"),
  exportCsvBtn: document.getElementById("export-csv-btn"),
  printBtn: document.getElementById("print-btn"),
  // theme & pwa
  themeToggle: document.getElementById("theme-toggle"),
  installBtn: document.getElementById("install-btn"),
};

// footer year
document.getElementById("year").textContent = new Date().getFullYear();

// theme
const savedTheme = localStorage.getItem("sep-theme");
if (savedTheme === "dark") document.documentElement.classList.add("dark");
updateThemeToggleAria();
els.themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem(
    "sep-theme",
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  updateThemeToggleAria();
});
function updateThemeToggleAria(){
  const pressed = document.documentElement.classList.contains("dark");
  els.themeToggle.setAttribute("aria-pressed", String(pressed));
}

// PWA install prompt
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  els.installBtn.hidden = false;
});
els.installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  els.installBtn.hidden = true;
});
// SW
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

// preload student data
(function preloadStudent() {
  const saved = JSON.parse(localStorage.getItem("sep-student") || "{}");
  if (saved.name) els.studentName.value = saved.name;
  if (saved.id) els.studentId.value = saved.id;
  if (saved.shuffleQ != null) els.shuffleQuestionsToggle.checked = !!saved.shuffleQ;
  if (saved.shuffleO != null) els.shuffleOptionsToggle.checked = !!saved.shuffleO;
  if (saved.minutes) els.examMinutes.value = saved.minutes;
})();

// state
let mcqData = [];          // array of {question, options[A..], answer, explanation, flagged}
let indexMap = [];         // mapping after shuffle for stable ids
let lastResults = null;    // array with grading
let flaggedSet = new Set(); // indices flagged
let timerState = { totalSec: 0, leftSec: 0, tickId: null, startedAt: 0 };

// flow: student -> input
els.continueBtn.addEventListener("click", () => {
  const name = els.studentName.value.trim();
  if (!name) { alert("Please enter your full name."); return; }

  if (els.rememberDevice.checked) {
    localStorage.setItem("sep-student", JSON.stringify({
      name,
      id: els.studentId.value.trim(),
      shuffleQ: els.shuffleQuestionsToggle.checked,
      shuffleO: els.shuffleOptionsToggle.checked,
      minutes: (els.examMinutes.value || "").trim()
    }));
  }
  toggle(els.studentSection, false);
  toggle(els.inputSection, true);
  els.mcqInput.focus();
});

// import .txt
els.loadFileBtn.addEventListener("click", async () => {
  const f = els.fileInput.files && els.fileInput.files[0];
  if (!f) { alert("Choose a .txt file first."); return; }
  const text = await f.text();
  els.mcqInput.value = text;
});

// clear input
els.clearInputBtn.addEventListener("click", () => {
  if (!els.mcqInput.value) return;
  if (confirm("Clear the MCQ input area?")) els.mcqInput.value = "";
});

// generate exam
els.generateBtn.addEventListener("click", () => {
  const src = els.mcqInput.value.trim();
  if (!src) { alert("Paste your MCQs first or import a file."); return; }

  const parsed = parseMCQs(src);
  if (!parsed.length) { alert("Could not parse MCQs. Please check the format."); return; }

  mcqData = parsed.map(q => ({ ...q, flagged: false }));
  // shuffle options if enabled
  if (els.shuffleOptionsToggle.checked) {
    mcqData.forEach(q => shuffleOptions(q));
  }
  // shuffle questions if enabled
  if (els.shuffleQuestionsToggle.checked) {
    const { arr, map } = shuffleWithMap(mcqData);
    mcqData = arr;
    indexMap = map;
  } else {
    indexMap = mcqData.map((_, i) => i);
  }

  renderExam(mcqData);
  els.studentNameLive.textContent = els.studentName.value.trim();
  updateProgress(0, mcqData.length);

  // timer
  setupAndStartTimer();

  // autosave state
  persistExamState("start");

  toggle(els.inputSection, false);
  toggle(els.examSection, true);

  // move focus to first question
  const first = els.examForm.querySelector('input[type="radio"]');
  if (first) first.focus();
});

// cancel back to input
els.cancelBtn.addEventListener("click", () => {
  if (!confirm("Go back and edit the exam? Your current selections will be kept for this session.")) return;
  toggle(els.examSection, false);
  toggle(els.inputSection, true);
});

// submit for grading
els.submitBtn.addEventListener("click", () => submitExam());

// retry full exam
els.retryBtn.addEventListener("click", () => {
  document.querySelectorAll("input[type=radio]").forEach(r => (r.checked = false));
  updateProgress(0, mcqData.length);
  flaggedSet.clear();
  mcqData.forEach(q => (q.flagged = false));
  renderNavigator();
  toggle(els.resultSection, false);
  toggle(els.examSection, true);
  setupAndStartTimer(); // restart timer if duration was set
});

// retest wrong only
els.retestWrongBtn.addEventListener("click", () => {
  if (!lastResults) { alert("No previous results found."); return; }
  const wrongQs = lastResults.filter(r => !r.isCorrect);
  if (!wrongQs.length) { alert("Great job! No wrong answers to retest."); return; }
  mcqData = wrongQs.map(r => ({
    question: r.question,
    options: r.options.slice(),
    answer: r.answer,
    explanation: r.explanation || "",
    flagged: false
  }));
  indexMap = mcqData.map((_, i) => i);
  renderExam(mcqData);
  els.studentNameLive.textContent = els.studentName.value.trim();
  updateProgress(0, mcqData.length);
  toggle(els.resultSection, false);
  toggle(els.examSection, true);
  setupAndStartTimer();
});

// retest flagged only
els.retestFlaggedBtn.addEventListener("click", () => {
  const flagged = (lastResults || []).filter(r => r.flagged);
  if (!flagged.length) { alert("No flagged questions were found."); return; }
  mcqData = flagged.map(r => ({
    question: r.question,
    options: r.options.slice(),
    answer: r.answer,
    explanation: r.explanation || "",
    flagged: false
  }));
  indexMap = mcqData.map((_, i) => i);
  renderExam(mcqData);
  els.studentNameLive.textContent = els.studentName.value.trim();
  updateProgress(0, mcqData.length);
  toggle(els.resultSection, false);
  toggle(els.examSection, true);
  setupAndStartTimer();
});

// export CSV
els.exportCsvBtn.addEventListener("click", () => {
  if (!lastResults) { alert("No results to export."); return; }
  const header = ["#","Question","Correct","YourAnswer","IsCorrect","Flagged","Explanation"];
  const rows = lastResults.map((r, i) => [
    i + 1,
    escapeCsv(r.question),
    r.answer,
    r.selected || "",
    r.isCorrect ? "TRUE" : "FALSE",
    r.flagged ? "TRUE" : "FALSE",
    escapeCsv(r.explanation || "")
  ]);
  const csv = [header, ...rows].map(row => row.map(csvCell).join(",")).join("\n");
  downloadBlob(csv, `smart-exam-results-${Date.now()}.csv`, "text/csv;charset=utf-8");
});

// print
els.printBtn.addEventListener("click", () => window.print());

// keyboard shortcuts (J/K next/prev, F flag)
document.addEventListener("keydown", (e) => {
  if (els.examSection.classList.contains("hidden")) return;
  if (e.key.toLowerCase() === "j") { focusNextQuestion(+1); }
  if (e.key.toLowerCase() === "k") { focusNextQuestion(-1); }
  if (e.key.toLowerCase() === "f") {
    const idx = getFocusedQuestionIndex();
    if (idx !== -1) toggleFlag(idx, true);
  }
});

// helpers
function toggle(el, show) { el.classList[show ? "remove" : "add"]("hidden"); }

function updateProgress(answered, total) {
  const pct = total ? Math.round((answered / total) * 100) : 0;
  els.progressFill.style.width = `${pct}%`;
  els.progressText.textContent = `${answered} / ${total}`;
}

function shuffleWithMap(arr) {
  const a = arr.slice();
  const map = a.map((_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
    [map[i], map[j]] = [map[j], map[i]];
  }
  return { arr: a, map };
}

function shuffleOptions(q) {
  // q.options like ["A) ...", "B) ...", ...], q.answer like "B"
  // We shuffle but keep track of where the correct answer moves.
  const opts = q.options.slice();
  const pairs = opts.map(o => {
    const letter = o[0].toUpperCase(); // 'A'
    return { letter, text: o.slice(3) };
  });
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  // Remap to A-D with new order
  const letters = ["A","B","C","D","E","F"];
  const rebuilt = pairs.map((p, i) => `${letters[i]}) ${p.text}`);
  const newAnswerLetter = rebuilt.findIndex(s => s.slice(3).trim() === pairs.find(x => x.letter === q.answer)?.text) + 1;
  q.options = rebuilt;
  q.answer = letters[newAnswerLetter - 1] || q.answer; // fallback
}

function renderExam(questions) {
  els.examForm.innerHTML = "";
  els.navPanel.innerHTML = "";
  flaggedSet.clear();

  questions.forEach((q, i) => {
    // container
    const wrap = document.createElement("fieldset");
    wrap.className = "question";
    wrap.id = `qwrap-${i}`;
    wrap.setAttribute("tabindex", "-1");
    const legend = document.createElement("legend");
    legend.className = "q-title";
    legend.appendChild(document.createTextNode(`Q${i + 1}: ${q.question}`));
    wrap.appendChild(legend);

    // options
    q.options.forEach(opt => {
      const letter = opt[0].toUpperCase(); // A/B/...
      const id = `q${i}_${letter}`;
      const label = document.createElement("label");
      label.className = "opt";
      label.setAttribute("for", id);

      const input = document.createElement("input");
      input.id = id;
      input.type = "radio";
      input.name = `q${i}`;
      input.value = letter;

      input.addEventListener("change", () => {
        const { answered } = getAnsweredCounts();
        updateProgress(answered, questions.length);
        renderNavigator(); // update answered state in nav
        persistExamState("progress");
      });

      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + opt));
      wrap.appendChild(label);
    });

    // flag
    const flagRow = document.createElement("div");
    flagRow.className = "flag-row";
    const flagLabel = document.createElement("label");
    flagLabel.className = "checkbox";
    const flag = document.createElement("input");
    flag.type = "checkbox";
    flag.setAttribute("aria-label", `Flag question ${i + 1}`);
    flag.addEventListener("change", () => {
      toggleFlag(i, flag.checked, false);
    });
    flagLabel.appendChild(flag);
    const span = document.createElement("span");
    span.textContent = "Flag for review";
    flagLabel.appendChild(flag);
    flagLabel.appendChild(span);
    flagRow.appendChild(flagLabel);
    wrap.appendChild(flagRow);

    els.examForm.appendChild(wrap);
  });

  // navigator
  renderNavigator();

  // restore autosaved selections if any
  restoreExamState();
  
  // progress as they answer (deduplicate by question name)
  els.examForm.addEventListener("change", () => {
    const { answered } = getAnsweredCounts();
    updateProgress(answered, questions.length);
  }, { once: true });
}

function renderNavigator() {
  els.navPanel.innerHTML = "";
  mcqData.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-pill";
    btn.textContent = String(i + 1);
    const isAnswered = !!document.querySelector(`input[name="q${i}"]:checked`);
    if (isAnswered) btn.classList.add("answered");
    if (mcqData[i].flagged) btn.classList.add("flagged");
    btn.addEventListener("click", () => scrollIntoViewQuestion(i));
    els.navPanel.appendChild(btn);
  });
}

function scrollIntoViewQuestion(i) {
  const target = document.getElementById(`qwrap-${i}`);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.focus({ preventScroll: true });
  }
}

function getAnsweredCounts() {
  const checked = Array.from(els.examForm.querySelectorAll('input[type="radio"]:checked'));
  const qnames = new Set(checked.map(r => r.name));
  return { answered: qnames.size, total: mcqData.length };
}

function getFocusedQuestionIndex() {
  const active = document.activeElement;
  if (!active) return -1;
  // find closest fieldset
  const fieldset = active.closest("fieldset.question") || document.querySelector("fieldset.question:focus");
  if (!fieldset) return -1;
  const id = fieldset.id; // qwrap-#
  const idx = parseInt(id.split("-")[1], 10);
  return Number.isNaN(idx) ? -1 : idx;
}

function focusNextQuestion(dir) {
  const current = getFocusedQuestionIndex();
  let next = current === -1 ? 0 : current + dir;
  if (next < 0) next = 0;
  if (next >= mcqData.length) next = mcqData.length - 1;
  scrollIntoViewQuestion(next);
}

function toggleFlag(i, checked, invertFromKeyboard = false) {
  if (invertFromKeyboard) {
    mcqData[i].flagged = !mcqData[i].flagged;
  } else {
    mcqData[i].flagged = !!checked;
  }
  const pill = els.navPanel.children[i];
  if (pill) pill.classList.toggle("flagged", mcqData[i].flagged);
  // sync checkbox in UI
  const wrap = document.getElementById(`qwrap-${i}`);
  const chk = wrap ? wrap.querySelector('input[type="checkbox"]') : null;
  if (chk && chk.checked !== mcqData[i].flagged) chk.checked = mcqData[i].flagged;
  persistExamState("flag");
}

function showResults(results, percent, timeUsedStr) {
  // ring progress
  const deg = Math.round((percent / 100) * 360);
  els.scoreRing.style.background = `conic-gradient(var(--accent) ${deg}deg, var(--ring-bg) 0deg)`;
  els.scorePercent.textContent = `${percent}%`;

  // meta
  els.studentNameResult.textContent = els.studentName.value.trim();
  els.qCount.textContent = results.length;
  const correct = results.filter(r => r.isCorrect).length;
  els.qCorrect.textContent = correct;
  els.qWrong.textContent = results.length - correct;
  els.qFlagged.textContent = results.filter(r => r.flagged).length || 0;
  els.timeUsed.textContent = timeUsedStr || "-";

  // details (safe text)
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
    ap.appendChild(document.createTextNode(`Your Answer: ${r.selected || "None"}`));
    ap.appendChild(document.createElement("br"));
    ap.appendChild(document.createTextNode(`Correct Answer: ${r.answer} `));
    const ansSpan = document.createElement("span");
    ansSpan.className = r.isCorrect ? "result-correct" : "result-wrong";
    ansSpan.textContent = r.isCorrect ? " ✔ Correct" : " ✘ Wrong";
    ap.appendChild(ansSpan);
    block.appendChild(ap);

    if (r.flagged) {
      const fp = document.createElement("p");
      fp.appendChild(document.createTextNode("Flagged for review"));
      block.appendChild(fp);
    }

    if (r.explanation) {
      const ep = document.createElement("p");
      const eStrong = document.createElement("strong");
      eStrong.textContent = "Explanation: ";
      ep.appendChild(eStrong);
      ep.appendChild(document.createTextNode(r.explanation));
      block.appendChild(ep);
    }

    els.analysis.appendChild(block);
  });

  // clear autosave after finish
  clearExamAutosave();

  toggle(els.examSection, false);
  toggle(els.resultSection, true);
}

// submit logic
function submitExam(auto = false) {
  const results = [];
  let correct = 0;

  mcqData.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    const ans = selected ? selected.value : null;
    const isCorrect = ans === q.answer;
    if (isCorrect) correct++;
    results.push({
      ...q,
      selected: ans,
      isCorrect
    });
  });

  lastResults = results; // save for retest
  const percent = Math.round((correct / mcqData.length) * 100);

  // time used
  const used = timerState.startedAt ? Math.max(0, Math.floor((Date.now() - timerState.startedAt) / 1000)) : 0;
  const timeUsedStr = formatTime(used);

  // stop timer
  stopTimer();

  showResults(results, percent, timeUsedStr);

  if (auto) alert("Time is up! Your exam has been submitted automatically.");
}

// parsing
function parseMCQs(text) {
  // Flexible: supports blank lines, extra spaces, Explanation spanning multiple lines
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const qs = [];
  let cur = emptyQ();

  const flush = () => {
    if (cur.question) qs.push({ ...cur });
    cur = emptyQ();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (/^Q\d+:/i.test(line)) {
      flush();
      cur.question = line.replace(/^Q\d+:\s*/i, "");
    } else if (/^[A-Z]\)/i.test(line)) {
      cur.options.push(normalizeOption(line));
    } else if (/^Answer\s*:/i.test(line)) {
      const a = line.split(":")[1]?.trim()?.toUpperCase() || "";
      cur.answer = (a.match(/[A-Z]/)?.[0]) || a;
    } else if (/^Explanation\s*:/i.test(line)) {
      cur.explanation = line.replace(/^Explanation\s*:\s*/i, "");
    } else {
      // explanation continuation lines allowed
      if (cur.explanation) cur.explanation += " " + line;
    }
  }
  flush();

  // filter invalid
  return qs.filter(q => q.question && q.options.length >= 2 && /^[A-Z]$/.test(q.answer));
}
function normalizeOption(s) {
  // Coerce "a) ..." or "A ) ..." → "A) ..."
  const m = s.match(/^([A-Za-z])\s*\)\s*(.*)$/);
  if (!m) return s;
  return `${m[1].toUpperCase()}) ${m[2].trim()}`;
}
function emptyQ(){ return { question: "", options: [], answer: "", explanation: "" }; }

// progress restore/persist
const AUTOSAVE_KEY = "sep-autosave";
function persistExamState(reason) {
  try {
    const entries = mcqData.map((q, i) => {
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      return {
        q: q.question,
        opts: q.options,
        ans: q.answer,
        exp: q.explanation,
        flagged: q.flagged || false,
        selected: sel ? sel.value : null
      };
    });
    const payload = {
      student: {
        name: els.studentName.value.trim(),
        id: els.studentId.value.trim()
      },
      mcqs: entries,
      timer: {
        totalSec: timerState.totalSec,
        leftSec: timerState.leftSec,
        startedAt: timerState.startedAt
      },
      reason,
      ts: Date.now()
    };
    sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
  } catch {}
}
function restoreExamState() {
  try {
    const raw = sessionStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.mcqs)) return;
    data.mcqs.forEach((e, i) => {
      mcqData[i].flagged = !!e.flagged;
      if (e.selected) {
        const input = document.getElementById(`q${i}_${e.selected}`);
        if (input) input.checked = true;
      }
    });
    renderNavigator();
    const { answered, total } = getAnsweredCounts();
    updateProgress(answered, total);
  } catch {}
}
function clearExamAutosave() {
  sessionStorage.removeItem(AUTOSAVE_KEY);
}

// timer
function setupAndStartTimer() {
  stopTimer();
  const minutes = parseInt((els.examMinutes.value || "").trim(), 10);
  if (!minutes || minutes <= 0) {
    els.timer.textContent = "";
    return;
  }
  timerState.totalSec = minutes * 60;
  timerState.leftSec = timerState.totalSec;
  timerState.startedAt = Date.now();
  els.timer.textContent = formatTime(timerState.leftSec);
  timerState.tickId = setInterval(() => {
    timerState.leftSec--;
    if (timerState.leftSec < 0) {
      stopTimer();
      submitExam(true);
      return;
    }
    els.timer.textContent = formatTime(timerState.leftSec);
    persistExamState("tick");
  }, 1000);
}
function stopTimer() {
  if (timerState.tickId) clearInterval(timerState.tickId);
  timerState.tickId = null;
}
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// results + grading
function computeResults() {
  const results = [];
  let correct = 0;

  mcqData.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    const ans = selected ? selected.value : null;
    const isCorrect = ans === q.answer;
    if (isCorrect) correct++;
    results.push({ ...q, selected: ans, isCorrect });
  });

  const percent = Math.round((correct / mcqData.length) * 100);
  return { results, percent };
}

// Utilities
function csvCell(x) {
  const s = String(x);
  const needsQuote = /[",\n]/.test
