// Smart Exam Pro — robust parser (line-based A–Z), import (.txt/.docx/.pdf),
// detailed per-option results, export PDF (all/wrong-only; with/without answers),
// and reliable PDF re-import with embedded payload.

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
let mcqData = [];          // [{question, options:[{letter,text}], answer, explanation}]
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
    const payload = tryExtractEmbeddedPayload(text);
    if (payload) {
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
    e.target.value = ""; // reset
  }
});

async function readFileAsTextSmart(file) {
  const name = file.name.toLowerCase();
  const type = file.type || "";
  if (type.startsWith("text/") || name.endsWith(".txt")) {
    return await file.text();
  }
  if (name.endsWith(".docx") ||
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return (result && result.value) ? normalizeWhitespace(result.value) : "";
  }
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
  return s
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ");
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

  const text = buildExportText(selected, includeAnswers);
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
    const maxWidth = 515;

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

    const p = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = `Q${i + 1}: `;
    p.appendChild(strong);
    p.appendChild(document.createTextNode(q.question));
    wrap.appendChild(p);

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

  els.examForm.addEventListener("change", () => {
    const total = questions.length;
    const answered = Array
      .from(els.examForm.querySelectorAll("input[type=radio]:checked"))
      .map(r => r.name).filter((v, i, arr) => arr.indexOf(v) === i).length;
    updateProgress(Math.round(answered / total * 100));
  }, { once: true });
}

// Detailed results with per-option badges
function showResults(results, percent) {
  const deg = Math.round((percent / 100) * 360);
  els.scoreRing.style.background =
    `conic-gradient(var(--accent) ${deg}deg, var(--ring-bg) 0deg)`;
  els.scorePercent.textContent = `${percent}%`;

  els.studentNameResult.textContent = els.studentName.value.trim();
  els.qCount.textContent = results.length;
  const correct = results.filter(r => r.isCorrect).length;
  els.qCorrect.textContent = correct;
  els.qWrong.textContent = results.length - correct;

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
    ap.appendChild(document.createTextNode(`Correct Answer: ${r.answer || "—"} `));
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

/* =========================
   PARSING (line-based, robust)
   ========================= */

function parseMCQs(text) {
  const normalized = text.replace(/\r/g, "");
  const blocks = splitQuestions(normalized);
  const questions = [];

  for (const blk of blocks) {
    const q = parseQuestionBlock(blk);
    if (q && q.question && q.options.length >= 2) {
      // ensure answer is among options if provided
      const letters = new Set(q.options.map(o => o.letter));
      if (q.answer && !letters.has(q.answer)) q.answer = "";
      questions.push(q);
    }
  }
  return questions;
}

function splitQuestions(text) {
  // Keep "Qn:" line with block
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

function parseQuestionBlock(block) {
  // Split to lines and work line-by-line (handles DOCX/PDF wraps)
  const lines = block.split("\n").map(l => l.replace(/\t/g, " ").trim());
  if (!lines.length) return null;

  // first line must start with Qn:
  const first = lines[0];
  const qHead = first.replace(/^Q\d+\s*:\s*/i, "").trim();

  // markers
  const isOptionStart = (s) => /^\(?([A-Z])\)?[.)]\s*/.test(s);
  const getOptionLetter = (s) => {
    const m = s.match(/^\(?([A-Z])\)?[.)]\s*/);
    return m ? m[1].toUpperCase() : "";
  };
  const stripOptionPrefix = (s) => s.replace(/^\(?[A-Z]\)?[.)]\s*/, "");

  const isAnswer = (s) => /^Answer\s*:/i.test(s);
  const isExplanation = (s) => /^Explanation\s*:/i.test(s);
  const isNextQ = (s) => /^Q\d+\s*:/i.test(s);

  // find first option line index
  let i = 1;
  while (i < lines.length && !isOptionStart(lines[i]) && !isAnswer(lines[i]) && !isExplanation(lines[i])) i++;

  // question stem is: if qHead present use it; otherwise gather lines[1..i-1]
  let questionStem = qHead || "";
  if (!questionStem) {
    questionStem = lines.slice(1, i).filter(Boolean).join(" ").trim();
  }

  // collect options
  const options = [];
  while (i < lines.length && isOptionStart(lines[i])) {
    let letter = getOptionLetter(lines[i]);
    let text = stripOptionPrefix(lines[i]).trim();

    // accumulate wrapped lines until next option/Answer/Explanation/next Q or EOF
    let j = i + 1;
    const buf = [];
    while (j < lines.length &&
           !isOptionStart(lines[j]) &&
           !isAnswer(lines[j]) &&
           !isExplanation(lines[j]) &&
           !isNextQ(lines[j])) {
      if (lines[j]) buf.push(lines[j]);
      j++;
    }
    if (buf.length) text = `${text} ${buf.join(" ")}`.trim();

    options.push({ letter, text });
    i = j;
  }

  // read Answer (single letter A–Z if present)
  let answer = "";
  let explanation = "";
  // scan remainder for Answer/Explanation
  while (i < lines.length) {
    const line = lines[i];
    if (isAnswer(line)) {
      const m = line.match(/^Answer\s*:\s*([A-Za-z])/i);
      if (m) answer = m[1].toUpperCase();
    } else if (isExplanation(line)) {
      // explanation can span multiple lines until next Q block (but blocks already split)
      explanation = line.replace(/^Explanation\s*:\s*/i, "").trim();
      let k = i + 1;
      const extra = [];
      while (k < lines.length && !isNextQ(lines[k])) {
        if (lines[k]) extra.push(lines[k]);
        k++;
      }
      if (extra.length) explanation = `${explanation} ${extra.join(" ")}`.trim();
      break; // explanation last
    }
    i++;
  }

  // fallback: if still no options but T/F lines exist without labels
  if (options.length === 0) {
    const tf = guessTFOptions(lines.slice(1).join("\n"));
    if (tf.length) options.push(...tf);
  }

  return {
    question: questionStem || qHead || "(untitled question)",
    options,
    answer,
    explanation
  };
}

function guessTFOptions(stem) {
  const lines = stem.split("\n").map(l => l.trim()).filter(Boolean);
  const out = [];
  for (const l of lines) {
    if (/^true$/i.test(l)) out.push({ letter: out.length ? "B" : "A", text: "true" });
    if (/^false$/i.test(l)) out.push({ letter: out.length ? "B" : "A", text: "false" });
  }
  return out;
}

/* ===== Export / Import of our own PDFs ===== */

const PAYLOAD_START = "%%SEP_PAYLOAD_START%%";
const PAYLOAD_END   = "%%SEP_PAYLOAD_END%%";

function buildExportText(selected, includeAnswers) {
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
