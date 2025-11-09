// Smart Exam Pro — robust parsing, import/export, wrong-only retest, full result review
const els = {
  // sections
  studentSection: document.getElementById("student-section"),
  inputSection: document.getElementById("input-section"),
  examSection: document.getElementById("exam-section"),
  resultSection: document.getElementById("result-section"),
  // student
  studentName: document.getElementById("student-name"),
  studentId: document.getElementById("student-id"),
  continueBtn: document.getElementById("continue-btn"),
  // input
  mcqInput: document.getElementById("mcq-input"),
  saveLocally: document.getElementById("save-locally"),
  generateBtn: document.getElementById("generate-btn"),
  importHereBtn: document.getElementById("import-here-btn"),
  // exam
  examForm: document.getElementById("exam-form"),
  submitBtn: document.getElementById("submit-btn"),
  cancelBtn: document.getElementById("cancel-btn"),
  progressFill: document.getElementById("progress-fill"),
  studentNameLive: document.getElementById("student-name-live"),
  // results
  retryBtn: document.getElementById("retry-btn"),
  backBtn: document.getElementById("back-btn"),
  retestWrongBtn: document.getElementById("retest-wrong-btn"),
  scoreRing: document.getElementById("score-ring"),
  scorePercent: document.getElementById("score-percent"),
  studentNameResult: document.getElementById("student-name-result"),
  qCount: document.getElementById("q-count"),
  qCorrect: document.getElementById("q-correct"),
  qWrong: document.getElementById("q-wrong"),
  analysis: document.getElementById("analysis"),
  // theme & file
  themeToggle: document.getElementById("theme-toggle"),
  fileInput: document.getElementById("file-input"),
  importBtn: document.getElementById("import-btn"),
  // export
  exportAllPdfBtn: document.getElementById("export-all-pdf-btn"),
  exportWrongPdfBtn: document.getElementById("export-wrong-pdf-btn"),
  exportCorrections: document.getElementById("export-corrections"),
};

// footer year
document.getElementById("year").textContent = new Date().getFullYear();

// theme
const savedTheme = localStorage.getItem("sep-theme");
if (savedTheme === "dark") document.documentElement.classList.add("dark");
els.themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("sep-theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
});

// preload student data
(function preloadStudent() {
  const saved = JSON.parse(localStorage.getItem("sep-student") || "{}");
  if (saved.name) els.studentName.value = saved.name;
  if (saved.id) els.studentId.value = saved.id;
})();

// state
let mcqData = [];          // current exam questions
let lastResults = null;    // last grading (for retest wrong only)

// flow: student -> input
els.continueBtn.addEventListener("click", () => {
  const name = els.studentName.value.trim();
  if (!name) { alert("Please enter your full name."); return; }
  if (els.saveLocally.checked) {
    localStorage.setItem("sep-student", JSON.stringify({ name, id: els.studentId.value.trim() }));
  }
  toggle(els.studentSection, false);
  toggle(els.inputSection, true);
});

// import buttons
els.importBtn.addEventListener("click", () => els.fileInput.click());
els.importHereBtn.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", handleImport);

// generate exam
els.generateBtn.addEventListener("click", () => {
  const src = els.mcqInput.value.trim();
  if (!src) { alert("Paste your MCQs first or import from file."); return; }
  mcqData = parseMCQs(src);
  if (!mcqData.length) { alert("Could not parse MCQs. Please check the format."); return; }
  renderExam(mcqData);
  els.studentNameLive.textContent = els.studentName.value.trim();
  updateProgress(0);
  toggle(els.inputSection, false);
  toggle(els.examSection, true);
});

// cancel back to input
els.cancelBtn.addEventListener("click", () => {
  toggle(els.examSection, false);
  toggle(els.inputSection, true);
});

// submit for grading
els.submitBtn.addEventListener("click", () => {
  const results = [];
  let correct = 0;

  mcqData.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    const ans = selected ? selected.value : null;
    const isCorrect = ans ? q.answer.includes(ans) : false;
    if (isCorrect) correct++;
    results.push({ ...q, selected: ans, isCorrect });
  });

  lastResults = results; // save for retest
  const percent = Math.round((correct / mcqData.length) * 100);
  showResults(results, percent);
});

// retry full exam
els.retryBtn.addEventListener("click", () => {
  document.querySelectorAll("input[type=radio]").forEach(r => r.checked = false);
  updateProgress(0);
  toggle(els.resultSection, false);
  toggle(els.examSection, true);
});

// retest wrong only
els.retestWrongBtn.addEventListener("click", () => {
  if (!lastResults) { alert("No previous results found."); return; }
  const wrongQs = lastResults.filter(r => !r.isCorrect);
  if (!wrongQs.length) { alert("Great job! No wrong answers to retest."); return; }
  mcqData = wrongQs.map(r => ({
    question: r.question,
    options: r.options.slice(),
    answer: r.answer.slice(),
    explanation: r.explanation || ""
  }));

  renderExam(mcqData);
  els.studentNameLive.textContent = els.studentName.value.trim();
  updateProgress(0);
  toggle(els.resultSection, false);
  toggle(els.examSection, true);
});

// back to create new exam
els.backBtn.addEventListener("click", () => {
  toggle(els.resultSection, false);
  toggle(els.inputSection, true);
});

// Export buttons
els.exportAllPdfBtn.addEventListener("click", () => exportResults({ wrongOnly: false, withCorrections: els.exportCorrections.checked }));
els.exportWrongPdfBtn.addEventListener("click", () => exportResults({ wrongOnly: true, withCorrections: els.exportCorrections.checked }));

/* ---------------- helpers ---------------- */
function toggle(el, show) { el.classList[show ? "remove" : "add"]("hidden"); }
function updateProgress(val) { els.progressFill.style.width = `${val}%`; }

/** Render exam (supports unlimited options A–Z) */
function renderExam(questions) {
  els.examForm.innerHTML = "";

  questions.forEach((q, i) => {
    const wrap = document.createElement("div");
    wrap.className = "question";

    // Question line
    const p = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = `Q${i + 1}: `;
    p.appendChild(strong);
    p.appendChild(document.createTextNode(q.question));
    wrap.appendChild(p);

    // Options
    q.options.forEach(opt => {
      // opt.label like 'A', value 'A', text the rest
      const letter = opt.label;
      const id = `q${i}_${letter}`;

      const label = document.createElement("label");
      label.className = "opt";
      label.setAttribute("for", id);

      const input = document.createElement("input");
      input.id = id;
      input.type = "radio";
      input.name = `q${i}`;
      input.value = letter;

      const spanLetter = document.createElement("span");
      spanLetter.className = "choice-badge";
      spanLetter.textContent = letter + ")";

      const spanText = document.createElement("span");
      spanText.className = "option-text";
      spanText.textContent = " " + opt.text;

      label.appendChild(input);
      label.appendChild(spanLetter);
      label.appendChild(spanText);
      wrap.appendChild(label);
    });

    els.examForm.appendChild(wrap);
  });

  // progress as they answer (attach once per render)
  els.examForm.addEventListener("change", () => {
    const total = questions.length;
    const answered = Array.from(els.examForm.querySelectorAll("input[type=radio]:checked"))
      .map(r => r.name).filter((v, i, arr) => arr.indexOf(v) === i).length;
    updateProgress(Math.round(answered / total * 100));
  }, { once: true });
}

/** Show results, including a full per-choice review */
function showResults(results, percent) {
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

  // details
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

    // Choices list with marks
    r.options.forEach(opt => {
      const line = document.createElement("div");
      line.className = "choice-line";
      const badge = document.createElement("span");
      badge.className = "choice-badge";
      badge.textContent = opt.label + ")";

      const text = document.createElement("span");
      text.className = "option-text";
      text.textContent = opt.text;

      const mark = document.createElement("span");
      mark.className = "choice-mark";
      // correct? selected? both?
      const isCorrectChoice = r.answer.includes(opt.label);
      const isSelected = r.selected === opt.label;
      if (isCorrectChoice && isSelected) {
        mark.classList.add("correct");
        mark.textContent = "  ✅ (correct, selected)";
      } else if (isCorrectChoice) {
        mark.classList.add("correct");
        mark.textContent = "  ✅ (correct)";
      } else if (isSelected) {
        mark.classList.add("wrong");
        mark.textContent = "  ❌ (your choice)";
      } else {
        mark.textContent = "";
      }

      line.appendChild(badge);
      line.appendChild(text);
      line.appendChild(mark);
      block.appendChild(line);
    });

    // Summary line
    const ap = document.createElement("p");
    const ansLetters = r.answer.join(" & ");
    ap.appendChild(document.createTextNode(`Your Answer: ${r.selected || "None"}  |  Correct Answer: ${ansLetters}`));
    ap.appendChild(document.createElement("br"));
    const ansSpan = document.createElement("span");
    ansSpan.className = r.isCorrect ? "result-correct" : "result-wrong";
    ansSpan.textContent = r.isCorrect ? " ✔ Correct" : " ✘ Wrong";
    ap.appendChild(ansSpan);
    block.appendChild(ap);

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

  toggle(els.examSection, false);
  toggle(els.resultSection, true);
}

/* ---------------- Import / Export ---------------- */

/** Import handler – opens chooser and reads text from supported files.
 * For .pdf we try to extract plain text via the browser's built-in text layer if available;
 * If not, we fall back to asking the user to export text from their PDF viewer.
 * For .docx, we attempt a light-weight unzip/XML text extraction; if it fails, we ask to save as .txt first.
 */
async function handleImport(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;

  try {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    let text = "";

    if (ext === "txt" || ext === "sep" || ext === "json") {
      text = await file.text();
    } else if (ext === "pdf") {
      // Very light attempt: some browsers expose text via file.text(); if not readable, show guidance
      try {
        text = await file.text(); // works when PDF is actually text-based (not guaranteed)
      } catch {
        alert("Direct PDF text extraction isn’t supported in this browser. Please export the PDF to .txt and import again.");
        return;
      }
    } else if (ext === "docx" || ext === "doc") {
      // Minimal docx: many .docx viewers return a text stream via file.text(); try it
      try {
        text = await file.text();
      } catch {
        alert("Direct DOC/DOCX parsing is limited here. Please save the file as .txt and re-import.");
        return;
      }
    } else {
      alert("Unsupported file type. Use .txt, .docx, .pdf, or the app's .sep export.");
      return;
    }

    // If it's our own export (SEP block), extract payload
    const extracted = extractSepBlock(text);
    if (extracted) text = extracted;

    // Put into textarea (for visibility & manual edit if needed)
    els.mcqInput.value = text;

    // Auto-parse to exam immediately if user is past student page
    mcqData = parseMCQs(text);
    if (!mcqData.length) {
      alert("Imported, but could not find well-formed questions. You can still edit in the textarea.");
      return;
    }
    renderExam(mcqData);
    els.studentNameLive.textContent = els.studentName.value.trim() || "Student";
    updateProgress(0);
    toggle(els.studentSection, false);
    toggle(els.inputSection, false);
    toggle(els.examSection, true);
  } finally {
    // reset input so selecting the same file again re-triggers change
    els.fileInput.value = "";
  }
}

/** Export results to print/PDF with optional wrong-only and corrections */
function exportResults({ wrongOnly, withCorrections }) {
  if (!lastResults) { alert("No results to export yet."); return; }
  const results = wrongOnly ? lastResults.filter(r => !r.isCorrect) : lastResults.slice();
  if (!results.length) { alert("Nothing to export for the chosen settings."); return; }

  // Build a lightweight printable page in a new window
  const wnd = window.open("", "_blank");
  const title = wrongOnly ? "Smart Exam Pro — Wrong Only" : "Smart Exam Pro — Full Results";
  const student = els.studentName.value.trim() || "Student";
  const now = new Date().toLocaleString();

  // Create app-readable payload block for re-import
  const payload = makeSepBlockFromResults(results);

  const css = `
    <style>
      body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px; color:#111}
      h1{margin:0 0 6px 0}
      .muted{color:#555}
      .q{margin:14px 0; border:1px solid #ddd; padding:10px; border-radius:10px}
      .choice{display:flex;gap:8px;align-items:flex-start}
      .badge{min-width:24px;text-align:center;font-weight:700}
      .ok{color:#0a7d51;font-weight:700}
      .bad{color:#b00020;font-weight:700}
      .small{font-size:12px;color:#666}
      pre{white-space:pre-wrap; word-wrap:break-word; font-family:ui-monospace,Menlo,Consolas,monospace; background:#fafafa; border:1px dashed #ddd; padding:10px; border-radius:10px}
      @media print {.noprint{display:none}}
    </style>`;

  const bodyTop = `
    <h1>${title}</h1>
    <div class="muted">Student: <b>${escapeHtml(student)}</b> &nbsp;|&nbsp; Generated: ${escapeHtml(now)}</div>
    <hr/>`;

  const parts = results.map((r, idx) => {
    const ansLetters = r.answer.join(" & ");
    const lines = r.options.map(opt => {
      const isCorrect = r.answer.includes(opt.label);
      const isSelected = r.selected === opt.label;
      let tail = "";
      if (withCorrections) {
        if (isCorrect && isSelected) tail = ` <span class="ok">✅ correct, selected</span>`;
        else if (isCorrect) tail = ` <span class="ok">✅ correct</span>`;
        else if (isSelected) tail = ` <span class="bad">❌ your choice</span>`;
      }
      return `<div class="choice"><span class="badge">${opt.label})</span><span>${escapeHtml(opt.text)}${tail}</span></div>`;
    }).join("");

    const exp = r.explanation ? `<div class="small"><b>Explanation:</b> ${escapeHtml(r.explanation)}</div>` : "";
    return `<div class="q">
      <div><b>Q${idx + 1}:</b> ${escapeHtml(r.question)}</div>
      ${lines}
      <div class="small"><b>Your answer:</b> ${escapeHtml(r.selected || "None")} &nbsp; | &nbsp; <b>Correct:</b> ${escapeHtml(ansLetters)}</div>
      ${exp}
    </div>`;
  }).join("");

  // Embed machine-readable block for re-import
  const body = `${bodyTop}${parts}<hr/><div class="small">Below is an embedded block Smart Exam Pro can re-import:</div><pre>${escapeHtml(payload)}</pre><div class="noprint"><em>Use your browser’s “Save as PDF”.</em></div>`;

  wnd.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${css}</head><body>${body}</body></html>`);
  wnd.document.close();
}

/* ---------------- Parsing ---------------- */

/**
 * Robust MCQ parser that accepts:
 * - Qn lines: /^Q\d+:\s*/i
 * - Options A–Z with variants: "A)", "A.", "A )", "A :" (case-insensitive)
 * - Multi-line option bodies (continues until next option/Answer/Qn)
 * - Answers: "Answer: B" or "Answer: B & D" or "Answer: B,D"
 * - Explanations: "Explanation: ..." (multi-line)
 * - Validates with >=1 option (not 2), so “A–E as listed; F) all above mentioned” won’t be dropped
 */
function parseMCQs(text) {
  const lines = text.split(/\r?\n/).map(l => l.replace(/\s+$/, "")); // right-trim
  const qs = [];
  let cur = emptyQ();

  // regex helpers
  const qHead = /^Q\s*(\d+)\s*:\s*(.*)$/i;
  const optHead = /^([A-Z])(?:\s*[\)\.\:])\s*(.*)$/; // A) A. A: A ) …
  const answerHead = /^Answer\s*:\s*(.+)$/i;
  const explHead = /^Explanation\s*:\s*(.*)$/i;

  const pushCur = () => {
    if (cur.question) {
      // normalize options: assign letters if missing, merge multi-line
      cur.options = normalizeOptions(cur.options);
      // normalize answer letters (supports 'B & D', 'B,D', 'b')
      cur.answer = normalizeAnswers(cur.answerRaw, cur.options);
      qs.push({
        question: cur.question.trim(),
        options: cur.options,
        answer: cur.answer,
        explanation: (cur.explanation || "").trim()
      });
    }
  };

  let collectingOption = null; // {label, text}

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) { // blank line extends option/expl as newline
      if (collectingOption) collectingOption.text += "\n";
      else if (cur.explanation) cur.explanation += "\n";
      continue;
    }

    // Question start?
    const mQ = line.match(qHead);
    if (mQ) {
      // flush previous
      if (collectingOption) { cur.options.push(collectingOption); collectingOption = null; }
      pushCur();
      cur = emptyQ();
      cur.question = mQ[2] || "";
      continue;
    }

    // Option head?
    const mO = line.match(optHead);
    if (mO) {
      if (collectingOption) { cur.options.push(collectingOption); }
      collectingOption = { label: mO[1].toUpperCase(), text: mO[2] || "" };
      continue;
    }

    // Answer?
    const mA = line.match(answerHead);
    if (mA) {
      if (collectingOption) { cur.options.push(collectingOption); collectingOption = null; }
      cur.answerRaw = (cur.answerRaw ? cur.answerRaw + " " : "") + mA[1];
      continue;
    }

    // Explanation?
    const mE = line.match(explHead);
    if (mE) {
      if (collectingOption) { cur.options.push(collectingOption); collectingOption = null; }
      cur.explanation = (mE[1] || "");
      continue;
    }

    // Continuations:
    if (collectingOption) {
      // append to current option text
      collectingOption.text += (collectingOption.text ? "\n" : "") + raw;
    } else if (cur.explanation) {
      cur.explanation += (cur.explanation ? " " : "") + raw;
    } else if (!cur.question && line) {
      // robustness: text before first Q — ignore
    } else {
      // If we’re inside a question but not inside an option or expl or answer, treat as question continuation
      if (cur.question) cur.question += " " + raw;
    }
  }
  if (collectingOption) { cur.options.push(collectingOption); collectingOption = null; }
  // push last
  pushCur();

  // Filter minimal validity: keep items with a question and at least ONE option, and at least an answer
  return qs.filter(q => q.question && q.options.length >= 1 && q.answer.length >= 1);
}

function emptyQ() { return { question: "", options: [], answerRaw: "", explanation: "" }; }

/** Merge multi-line options, ensure label is single letter, trim text */
function normalizeOptions(opts) {
  // collapse duplicate labels by keeping first non-empty text, then appending
  const map = new Map();
  opts.forEach(o => {
    const label = (o.label || "").toUpperCase();
    const text = (o.text || "").trim();
    if (!label || !/^[A-Z]$/.test(label)) return;
    if (!map.has(label)) map.set(label, text);
    else map.set(label, (map.get(label) + (text ? "\n" + text : "")).trim());
  });
  // output sorted by label
  return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([label,text]) => ({ label, text }));
}

/** Accept "B", "b", "B & D", "B,D", "B;D", "B and D" → ["B","D"] that actually exist in options */
function normalizeAnswers(raw, options) {
  const letters = new Set(options.map(o => o.label));
  const picks = String(raw || "")
    .replace(/and/gi, ",")
    .replace(/[;&+\/]/g, ",")
    .replace(/\s+/g, "")
    .split(",")
    .map(x => x.toUpperCase())
    .filter(x => /^[A-Z]$/.test(x) && letters.has(x));
  // default fallback: if none matched but options exist and raw looked like a letter, try first char
  if (!picks.length && raw && /^[A-Za-z]/.test(raw)) {
    const c = raw[0].toUpperCase();
    if (letters.has(c)) picks.push(c);
  }
  return Array.from(new Set(picks)); // unique
}

/** Create a machine-readable block for exports that we can re-import later */
function makeSepBlockFromResults(results) {
  // Turn results back into the text MCQ format so re-import is reliable
  const lines = [];
  results.forEach((r, idx) => {
    lines.push(`Q${idx + 1}: ${r.question}`);
    r.options.forEach(o => lines.push(`${o.label}) ${o.text}`));
    lines.push(`Answer: ${r.answer.join(" & ")}`);
    if (r.explanation) lines.push(`Explanation: ${r.explanation}`);
    lines.push(""); // blank
  });
  return [
    "###SEP-EXAM-BEGIN###",
    ...lines,
    "###SEP-EXAM-END###"
  ].join("\n");
}

/** Extract SEP block from imported text, if present */
function extractSepBlock(text) {
  const s = text.indexOf("###SEP-EXAM-BEGIN###");
  const e = text.indexOf("###SEP-EXAM-END###");
  if (s !== -1 && e !== -1 && e > s) {
    return text.slice(s + "###SEP-EXAM-BEGIN###".length, e).trim();
  }
  return null;
}

/* ---------------- Utils ---------------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
