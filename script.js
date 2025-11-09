// Smart Exam Pro — robust parse (A–Z), import (.txt/.docx/.pdf), option-level result view,
// export PDF (all/wrong-only, with/without answers), and PDF re-import via embedded payload.

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
  importBtn: document.getElementById("import-btn"),
  fileInput: document.getElementById("file-input"),
  importStatus: document.getElementById("import-status"),
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
  // export
  exportScope: document.getElementById("export-scope"),
  exportIncludeAnswers: document.getElementById("export-include-answers"),
  exportBtn: document.getElementById("export-pdf-btn"),
  exportStatus: document.getElementById("export-status"),
  // theme
  themeToggle: document.getElementById("theme-toggle"),
};

// footer year
document.getElementById("year").textContent = new Date().getFullYear();

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
  const saved = JSON.parse(localStorage.getItem("sep-student") || "{}");
  if (saved.name) els.studentName.value = saved.name;
  if (saved.id) els.studentId.value = saved.id;
})();

// state
let mcqData = [];          // [{question, options: [{letter,text}], answer, explanation}]
let lastResults = null;    // graded results

// flow: student -> input
els.continueBtn.addEventListener("click", () => {
  const name = els.studentName.value.trim();
  if (!name) { alert("Please enter your full name."); return; }
  if (els.saveLocally.checked) {
    localStorage.setItem("sep-student", JSON.stringify({
      name,
      id: els.studentId.value.trim()
    }));
  }
  toggle(els.studentSection, false);
  toggle(els.inputSection, true);
});

// import from file (opens picker)
els.importBtn.addEventListener("click", () => els.fileInput.click());

els.fileInput.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  els.importStatus.textContent = `Reading ${file.name}…`;
  try {
    const text = await readFileAsTextSmart(file);
    // If our own PDF, it contains embedded payload markers → reconstruct exam directly
    const payload = tryExtractEmbeddedPayload(text);
    if (payload) {
      // rebuild MCQ in textarea for user review and allow regenerate
      els.mcqInput.value = buildMCQTextFromPayload(payload);
      els.importStatus.textContent = `Imported ${file.name} (recognized Smart Exam Pro format).`;
    } else {
      els.mcqInput.value = text;
      els.importStatus.textContent = `Imported ${file.name}. Review the text, then Generate.`;
    }
  } catch (err) {
    console.error(err);
    els.importStatus.textContent = "Import failed. Try a .txt, .docx, or .pdf formatted with MCQs.";
    alert("Sorry, that file couldn't be imported. Make sure it contains text MCQs.");
  } finally {
    e.target.value = ""; // reset for subsequent imports of same filename
  }
});

async function readFileAsTextSmart(file) {
  const name = file.name.toLowerCase();
  const type = file.type || "";
  // Plain text
  if (type.startsWith("text/") || name.endsWith(".txt")) {
    return await file.text();
  }
  // DOCX via Mammoth (raw text keeps structure best)
  if (name.endsWith(".docx") ||
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return (result && result.value) ? normalizeWhitespace(result.value) : "";
  }
  // PDF via PDF.js (concatenate page text)
  if (name.endsWith(".pdf") || type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let out = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const pageText = tc.items.map(it => (it.str || "")).join(" ");
      out += pageText + "\n";
    }
    return normalizeWhitespace(out);
  }
  throw new Error("Unsupported file type");
}

function normalizeWhitespace(s) {
  // PDFs/DOCX often add erratic spacing. Preserve line breaks where they clearly delimit blocks.
  return s.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ");
}

// generate exam
els.generateBtn.addEventListener("click", () => {
  const src = els.mcqInput.value.trim();
  if (!src) { alert("Paste your MCQs first."); return; }
  mcqData = parseMCQs(src);
  if (!mcqData.length) {
    alert("Could not parse MCQs. Please check the format (Q#:, A) …, Answer: X, Explanation: …).");
    return;
  }
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
    const isCorrect = ans === q.answer;
    if (isCorrect) correct++;
    results.push({ ...q, selected: ans, isCorrect });
  });

  lastResults = results;
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
    options: r.options.map(o => ({...o})),
    answer: r.answer,
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

// export PDF
els.exportBtn.addEventListener("click", async () => {
  if (!lastResults) { alert("Nothing to export yet."); return; }
  els.exportStatus.textContent = "Building PDF…";

  const scope = els.exportScope.value; // "all" or "wrong"
  const includeAnswers = !!els.exportIncludeAnswers.checked;

  const selected = scope === "wrong" ? lastResults.filter(r => !r.isCorrect) : lastResults.slice();

  // Build text in our canonical importable format
  const text = buildExportText(selected, includeAnswers);

  // Build embedded payload for perfect re-import
  const payload = {
    version: 1,
    student: els.studentName.value.trim(),
    generatedAt: new Date().toISOString(),
    includeAnswers,
    scope,
    questions: selected.map(q => ({
      question: q.question,
      options: q.options.map(o => ({ letter: o.letter, text: o.text })),
      answer: q.answer,
      explanation: q.explanation || ""
    }))
  };
  const embedded = embedPayload(text, payload);

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const maxWidth = 515; // ~A4 width - 2*margin

    const lines = doc.splitTextToSize(embedded, maxWidth);
    let y = margin;
    doc.setFont("courier", "normal");
    doc.setFontSize(10);

    lines.forEach((ln) => {
      if (y > 780) { doc.addPage(); y = margin; }
      doc.text(ln, margin, y);
      y += 14;
    });

    const fname = `SmartExamPro_${scope}_${includeAnswers ? "withAns" : "noAns"}_${Date.now()}.pdf`;
    doc.save(fname);
    els.exportStatus.textContent = `Saved ${fname}`;
  } catch (e) {
    console.error(e);
    els.exportStatus.textContent = "Export failed.";
    alert("PDF export failed. Check console for details.");
  }
});

// helpers
function toggle(el, show) { el.classList[show ? "remove" : "add"]("hidden"); }
function updateProgress(val) { els.progressFill.style.width = `${val}%`; }

// Render exam form
function renderExam(questions) {
  els.examForm.innerHTML = "";

  questions.forEach((q, i) => {
    const wrap = document.createElement("div");
    wrap.className = "question";

    // Question line (safe)
    const p = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = `Q${i + 1}: `;
    p.appendChild(strong);
    p.appendChild(document.createTextNode(q.question));
    wrap.appendChild(p);

    // Options (safe) – radio list
    q.options.forEach(opt => {
      const letter = (opt.letter || "").toUpperCase();
      const id = `q${i}_${letter}`;

      const label = document.createElement("label");
      label.className = "opt";
      if (letter) label.setAttribute("for", id);

      const input = document.createElement("input");
      input.id = id;
      input.type = "radio";
      input.name = `q${i}`;
      input.value = letter;

      label.appendChild(input);
      label.appendChild(document.createTextNode(` ${letter}) ${opt.text}`));
      wrap.appendChild(label);
    });

    els.examForm.appendChild(wrap);
  });

  // progress as they answer (once per render)
  els.examForm.addEventListener("change", () => {
    const total = questions.length;
    const answered = Array
      .from(els.examForm.querySelectorAll("input[type=radio]:checked"))
      .map(r => r.name).filter((v, i, arr) => arr.indexOf(v) === i).length;
    updateProgress(Math.round(answered / total * 100));
  }, { once: true });
}

// Detailed results view with per-option badges
function showResults(results, percent) {
  // ring progress
  const deg = Math.round((percent / 100) * 360);
  els.scoreRing.style.background =
    `conic-gradient(var(--accent) ${deg}deg, var(--ring-bg) 0deg)`;
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

    // options listing with status badges
    const ul = document.createElement("div");
    r.options.forEach(opt => {
      const row = document.createElement("div");
      row.className = "opt result-opt";
      const label = `${opt.letter}) ${opt.text}`;
      let badgeText = "";
      let badgeClass = "badge";

      if (opt.letter === r.answer) {
        badgeText = "Correct";
        badgeClass += " badge-correct";
      }
      if (r.selected === opt.letter && r.selected !== r.answer) {
        badgeText = "Your choice (Wrong)";
        badgeClass += " badge-wrong";
      }
      if (r.selected === opt.letter && r.selected === r.answer) {
        badgeText = "Your choice (Correct)";
        badgeClass += " badge-selected";
      }

      row.appendChild(document.createTextNode(label + " "));
      if (badgeText) {
        const b = document.createElement("span");
        b.className = badgeClass;
        b.textContent = badgeText;
        row.appendChild(b);
      }
      ul.appendChild(row);
    });
    block.appendChild(ul);

    const ap = document.createElement("p");
    ap.appendChild(document.createTextNode(`Your Answer: ${r.selected || "None"}`));
    ap.appendChild(document.createElement("br"));
    const ansSpan = document.createElement("span");
    ansSpan.className = r.isCorrect ? "result-correct" : "result-wrong";
    ansSpan.textContent = r.isCorrect ? " ✔ Correct" : " ✘ Wrong";
    ap.appendChild(document.createTextNode(`Correct Answer: ${r.answer} `));
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

/* ========== Parsing ==========

We parse in two passes:

1) Split the whole text into question blocks starting at /^Q\d+:/ (case-insensitive).
2) Inside each block, extract options by finding sequences like:
   A) ..., B) ..., up to Z) ..., allowing messy line wraps from DOCX/PDF.
   We also accept A. or (A) styles.
3) Extract Answer: <letter> (first A–Z) and optional Explanation: (multi-line).

This survives long exams and odd spacing, and does not require exactly 4 options.
*/
function parseMCQs(text) {
  const normalized = text.replace(/\r/g, "");
  const qSplits = splitQuestions(normalized);
  const questions = [];

  qSplits.forEach((blk) => {
    const q = extractQuestion(blk);
    if (q && q.question && q.options.length >= 2) {
      // Validate answer if present
      const letters = q.options.map(o => o.letter);
      if (q.answer && !letters.includes(q.answer)) {
        // If answer not among options, keep question but blank out answer (user can still practice)
        q.answer = "";
      }
      questions.push(q);
    }
  });

  return questions;
}

function splitQuestions(text) {
  // Keep the leading Q-number on each block
  const re = /(^|\n)(Q\d+\s*:)/ig;
  const idxs = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    idxs.push(m.index + (m[1] ? m[1].length : 0));
  }
  const blocks = [];
  for (let i = 0; i < idxs.length; i++) {
    const start = idxs[i];
    const end = i + 1 < idxs.length ? idxs[i + 1] : text.length;
    blocks.push(text.slice(start, end).trim());
  }
  return blocks;
}

function extractQuestion(block) {
  // Get the stem after Qn:
  const stem = block.replace(/^Q\d+\s*:\s*/i, "");
  // Split off "Answer:" and "Explanation:" anchors (keep text)
  const answerMatch = /(^|\n)Answer\s*:\s*([A-Za-z])/i.exec(stem);
  const explanationMatch = /(^|\n)Explanation\s*:\s*/i.exec(stem);

  // For options: run a global regex that finds A)/A./(A) and captures until next label or Answer/Explanation/new Q
  const opts = [];
  const optRe = /(?:^|\n|\s)(?:\(?([A-Z])\)?[.)]\s*)([\s\S]*?)(?=(?:\(?[A-Z]\)?[.)]\s)|(?:\nAnswer\s*:)|(?:\nExplanation\s*:)|(?:\nQ\d+\s*:)|$)/g;
  // Only consider letters A–Z and ignore accidental labels after the answer section
  let region = stem;
  if (answerMatch) region = region.slice(0, answerMatch.index);
  if (explanationMatch && (!answerMatch || explanationMatch.index < answerMatch.index))
    region = region.slice(0, explanationMatch.index);

  let mo;
  while ((mo = optRe.exec(region)) !== null) {
    const letter = (mo[1] || "").toUpperCase();
    const text = collapse(mo[2] || "");
    if (letter && text) {
      opts.push({ letter, text });
    }
  }

  // Determine answer letter
  let ans = "";
  if (answerMatch) {
    ans = (answerMatch[2] || "").toUpperCase();
  }

  // Explanation (multi-line)
  let expl = "";
  if (explanationMatch) {
    const start = explanationMatch.index + explanationMatch[0].length;
    expl = collapse(stem.slice(start));
  }

  return {
    question: collapse(stem.split(/\n/)[0]).replace(/^[A-Z]\)\s*.*$/,'').trim() || collapse(stem).split(/\n/)[0].trim(),
    options: opts.length ? opts : guessTFOptions(stem), // fallback for True/False lines without labels
    answer: ans,
    explanation: expl
  };
}

function collapse(s) {
  return s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function guessTFOptions(stem) {
  // Fallback if no labeled options found but we see 'true'/'false' options on their own lines
  const lines = stem.split("\n").map(l => l.trim()).filter(Boolean);
  const tf = [];
  lines.forEach(l => {
    if (/^true$/i.test(l)) tf.push({ letter: "A", text: "true" });
    if (/^false$/i.test(l)) tf.push({ letter: tf.length ? "B" : "A", text: "false" });
  });
  return tf;
}

/* ===== Export / Import of our own PDFs ===== */

const PAYLOAD_START = "%%SEP_PAYLOAD_START%%";
const PAYLOAD_END   = "%%SEP_PAYLOAD_END%%";

function buildExportText(selected, includeAnswers) {
  // Build in canonical, import-friendly format
  let out = "";
  selected.forEach((q, idx) => {
    out += `Q${idx + 1}: ${q.question}\n`;
    q.options.forEach(opt => {
      out += `${opt.letter}) ${opt.text}\n`;
    });
    if (includeAnswers && q.answer) out += `Answer: ${q.answer}\n`;
    if (includeAnswers && q.explanation) out += `Explanation: ${q.explanation}\n`;
    out += "\n";
  });
  return out.trim() + "\n";
}

function embedPayload(humanText, payloadObj) {
  // Embed a base64 JSON payload delimited by markers for reliable re-import from PDF text layer
  const json = JSON.stringify(payloadObj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return humanText
    + "\n\n"
    + "---- Smart Exam Pro export ----\n"
    + PAYLOAD_START + "\n"
    + b64 + "\n"
    + PAYLOAD_END + "\n";
}

function tryExtractEmbeddedPayload(extractedPdfText) {
  const start = extractedPdfText.indexOf(PAYLOAD_START);
  const end = extractedPdfText.indexOf(PAYLOAD_END);
  if (start === -1 || end === -1 || end < start) return null;
  const content = extractedPdfText.slice(start + PAYLOAD_START.length, end).trim();
  try {
    const json = decodeURIComponent(escape(atob(content)));
    const obj = JSON.parse(json);
    if (obj && Array.isArray(obj.questions)) return obj;
  } catch (e) { /* ignore */ }
  return null;
}

function buildMCQTextFromPayload(payload) {
  return payload.questions.map((q, i) => {
    const head = `Q${i + 1}: ${q.question}`;
    const opts = q.options.map(o => `${o.letter}) ${o.text}`).join("\n");
    const ans = payload.includeAnswers && q.answer ? `\nAnswer: ${q.answer}` : "";
    const ex  = payload.includeAnswers && q.explanation ? `\nExplanation: ${q.explanation}` : "";
    return `${head}\n${opts}${ans}${ex}`;
  }).join("\n\n");
}
