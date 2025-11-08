// Smart Exam Pro — safe rendering + “Retest Wrong Only”
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
      const letter = opt[0].toUpperCase(); // A/B/C/D
      const id = `q${i}_${letter}`;

      const label = document.createElement("label");
      label.className = "opt";
      label.setAttribute("for", id);

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

  // progress as they answer
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
  // Qn:, A) .. D), Answer: X, Explanation: ...
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
    } else if (/^[A-D]\)/i.test(line)) {
      cur.options.push(line);
    } else if (/^Answer:/i.test(line)) {
      cur.answer = line.split(":")[1].trim().toUpperCase();
    } else if (/^Explanation:/i.test(line)) {
      cur.explanation = line.replace(/^Explanation:\s*/i, "");
    } else {
      // allow multi-line explanation continuation
      if (cur.explanation) cur.explanation += " " + line;
    }
  }
  if (cur.question) qs.push(cur);

  // basic validation
  return qs.filter(q => q.question && q.options.length >= 2 && /[A-D]/.test(q.answer));
}
function emptyQ() { return { question: "", options: [], answer: "", explanation: "" }; }
