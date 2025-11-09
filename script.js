// Smart Exam Pro — extended options (A–Z) + import from file (txt/docx/pdf)
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
let mcqData = [];          // current exam questions
let lastResults = null;    // last grading (for retest wrong only)

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

// import from file
els.importBtn.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  els.importStatus.textContent = `Reading ${file.name}…`;
  try {
    const text = await readFileAsTextSmart(file);
    els.mcqInput.value = text;
    els.importStatus.textContent = `Imported ${file.name}. Review the text, then Generate.`;
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
  // Plain text
  if (type.startsWith("text/") || name.endsWith(".txt")) {
    return await file.text();
  }
  // DOCX via Mammoth
  if (name.endsWith(".docx") || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return (result && result.value) ? result.value : "";
  }
  // PDF via PDF.js — concatenate page text
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
    return out;
  }
  throw new Error("Unsupported file type");
}

// generate exam
els.generateBtn.addEventListener("click", () => {
  const src = els.mcqInput.value.trim();
  if (!src) { alert("Paste your MCQs first."); return; }
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
    const isCorrect = ans === q.answer;
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

// helpers
function toggle(el, show) {
  el.classList[show ? "remove" : "add"]("hidden");
}
function updateProgress(val) {
  els.progressFill.style.width = `${val}%`;
}
function renderExam(questions) {
  els.examForm.innerHTML = "";

  questions.forEach((q, i) => {
    const wrap = document.createElement("div");
    wrap.className = "question";

    // Question line (safe text)
    const p = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = `Q${i + 1}: `;
    p.appendChild(strong);
    p.appendChild(document.createTextNode(q.question));
    wrap.appendChild(p);

    // Options (safe text — no innerHTML)
    q.options.forEach(opt => {
      // opt expected like "A) option text", but we safely derive letter
      const letterMatch = /^([A-Z])\)/i.exec(opt);
      const letter = letterMatch ? letterMatch[1].toUpperCase() : "";
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
      label.appendChild(document.createTextNode(" " + opt)); // text node prevents HTML parsing
      wrap.appendChild(label);
    });

    els.examForm.appendChild(wrap);
  });

  // progress as they answer (once per render)
  els.examForm.addEventListener("change", () => {
    const total = questions.length;
    const answered = Array.from(els.examForm.querySelectorAll("input[type=radio]:checked"))
      .map(r => r.name).filter((v, i, arr) => arr.indexOf(v) === i).length;
    updateProgress(Math.round(answered / total * 100));
  }, { once: true });
}
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

function parseMCQs(text) {
  // Supports: Qn:, options labeled A) … Z), Answer: <letter>, Explanation: … (multi-line)
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const qs = [];
  let cur = emptyQ();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (/^Q\d+:/i.test(line)) {
      if (cur.question) qs.push({ ...cur });
      cur = emptyQ();
      cur.question = line.replace(/^Q\d+:\s*/i, "");
    } else if (/^[A-Z]\)/i.test(line)) {
      // Accept option labels A) to Z)
      cur.options.push(line);
    } else if (/^Answer:/i.test(line)) {
      // Extract first letter A–Z after colon (covers 'B', 'B)', '(B)')
      const after = line.split(":")[1] || "";
      const m = /([A-Z])/i.exec(after);
      cur.answer = m ? m[1].toUpperCase() : "";
    } else if (/^Explanation:/i.test(line)) {
      cur.explanation = line.replace(/^Explanation:\s*/i, "");
    } else {
      // allow multi-line explanation continuation
      if (cur.explanation) cur.explanation += " " + line;
    }
  }
  if (cur.question) qs.push(cur);

  // basic validation: at least 2 options, answer within provided option letters
  return qs.filter(q => {
    if (!q.question || q.options.length < 2 || !/[A-Z]/.test(q.answer)) return false;
    const letters = q.options.map(o => (o.match(/^([A-Z])\)/i) || [," "])[1]?.toUpperCase());
    return letters.includes(q.answer);
  });
}

function emptyQ() { return { question: "", options: [], answer: "", explanation: "" }; }
