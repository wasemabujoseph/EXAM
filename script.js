// Smart Exam Pro
const els = {
  studentSection: document.getElementById("student-section"),
  inputSection: document.getElementById("input-section"),
  examSection: document.getElementById("exam-section"),
  resultSection: document.getElementById("result-section"),
  studentName: document.getElementById("student-name"),
  studentId: document.getElementById("student-id"),
  continueBtn: document.getElementById("continue-btn"),
  mcqInput: document.getElementById("mcq-input"),
  saveLocally: document.getElementById("save-locally"),
  generateBtn: document.getElementById("generate-btn"),
  examForm: document.getElementById("exam-form"),
  submitBtn: document.getElementById("submit-btn"),
  cancelBtn: document.getElementById("cancel-btn"),
  retryBtn: document.getElementById("retry-btn"),
  backBtn: document.getElementById("back-btn"),
  progressFill: document.getElementById("progress-fill"),
  studentNameLive: document.getElementById("student-name-live"),
  studentNameResult: document.getElementById("student-name-result"),
  scoreRing: document.getElementById("score-ring"),
  scorePercent: document.getElementById("score-percent"),
  qCount: document.getElementById("q-count"),
  qCorrect: document.getElementById("q-correct"),
  qWrong: document.getElementById("q-wrong"),
  analysis: document.getElementById("analysis"),
  themeToggle: document.getElementById("theme-toggle"),
};

document.getElementById("year").textContent = new Date().getFullYear();

// Theme handling
const savedTheme = localStorage.getItem("sep-theme");
if (savedTheme === "dark") document.documentElement.classList.add("dark");
els.themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("sep-theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
});

// Persist name/id
(function preloadStudent(){
  const saved = JSON.parse(localStorage.getItem("sep-student") || "{}");
  if (saved.name) els.studentName.value = saved.name;
  if (saved.id) els.studentId.value = saved.id;
})();

let mcqData = [];

// Flow: Student -> Input
els.continueBtn.addEventListener("click", () => {
  const name = els.studentName.value.trim();
  if (!name) { alert("Please enter your full name."); return; }
  if (els.saveLocally.checked){
    localStorage.setItem("sep-student", JSON.stringify({name, id: els.studentId.value.trim()}));
  }
  toggle(els.studentSection, false);
  toggle(els.inputSection, true);
});

// Generate Exam
els.generateBtn.addEventListener("click", () => {
  const src = els.mcqInput.value.trim();
  if (!src){ alert("Paste your MCQs first."); return; }
  mcqData = parseMCQs(src);
  if (!mcqData.length){ alert("Could not parse MCQs. Please check the format."); return; }
  renderExam(mcqData);
  els.studentNameLive.textContent = els.studentName.value.trim();
  updateProgress(0);
  toggle(els.inputSection, false);
  toggle(els.examSection, true);
});

// Cancel back to input
els.cancelBtn.addEventListener("click", () => {
  toggle(els.examSection, false);
  toggle(els.inputSection, true);
});

// Submit
els.submitBtn.addEventListener("click", () => {
  const results = [];
  let correct = 0;
  mcqData.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    const ans = selected ? selected.value : null;
    const isCorrect = ans === q.answer;
    if (isCorrect) correct++;
    results.push({...q, selected: ans, isCorrect});
  });
  const percent = Math.round((correct / mcqData.length) * 100);
  showResults(results, percent);
});

// Retry / Back
els.retryBtn.addEventListener("click", () => {
  document.querySelectorAll("input[type=radio]").forEach(r => r.checked = false);
  updateProgress(0);
  toggle(els.resultSection, false);
  toggle(els.examSection, true);
});
els.backBtn.addEventListener("click", () => {
  toggle(els.resultSection, false);
  toggle(els.inputSection, true);
});

function toggle(el, show){
  el.classList[show ? "remove" : "add"]("hidden");
}

function updateProgress(val){
  els.progressFill.style.width = `${val}%`;
}

function renderExam(questions){
  els.examForm.innerHTML = "";
  questions.forEach((q, i) => {
    const wrap = document.createElement("div");
    wrap.className = "question";
    wrap.innerHTML = `<p><strong>Q${i+1}:</strong> ${q.question}</p>`;
    q.options.forEach(opt => {
      const letter = opt[0].toUpperCase();
      const id = `q${i}_${letter}`;
      const label = document.createElement("label");
      label.className = "opt";
      label.setAttribute("for", id);
      label.innerHTML = `<input id="${id}" type="radio" name="q${i}" value="${letter}"> ${opt}`;
      wrap.appendChild(label);
    });
    els.examForm.appendChild(wrap);
  });

  // Update progress as the student answers
  els.examForm.addEventListener("change", () => {
    const total = questions.length;
    const answered = Array.from(els.examForm.querySelectorAll("input[type=radio]:checked"))
      .map(r => r.name).filter((v, i, arr) => arr.indexOf(v) === i).length;
    updateProgress(Math.round(answered / total * 100));
  }, { once: true });
}

function showResults(results, percent){
  // Ring progress
  const deg = Math.round(percent / 100 * 360);
  els.scoreRing.style.background = `conic-gradient(var(--accent) ${deg}deg, var(--ring-bg) 0deg)`;
  els.scorePercent.textContent = `${percent}%`;

  // Meta
  els.studentNameResult.textContent = els.studentName.value.trim();
  els.qCount.textContent = results.length;
  const correct = results.filter(r => r.isCorrect).length;
  els.qCorrect.textContent = correct;
  els.qWrong.textContent = results.length - correct;

  // Detailed analysis
  els.analysis.innerHTML = "";
  results.forEach((r, i) => {
    const block = document.createElement("div");
    block.className = "question";
    block.innerHTML = `
      <p><strong>Q${i+1}:</strong> ${r.question}</p>
      <p>Your Answer: ${r.selected || "<em>None</em>"}<br>
      Correct Answer: ${r.answer} <span class="${r.isCorrect ? 'result-correct':'result-wrong'}"> ${r.isCorrect ? "✔ Correct" : "✘ Wrong"}</span></p>
      ${r.explanation ? `<p><strong>Explanation:</strong> ${escapeHtml(r.explanation)}</p>` : ""}
    `;
    els.analysis.appendChild(block);
  });

  toggle(els.examSection, false);
  toggle(els.resultSection, true);
}

function parseMCQs(text){
  // Supports: Qn:, A) .. D), Answer: X, Explanation: ...
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const qs = [];
  let cur = emptyQ();
  for (let i=0;i<lines.length;i++){
    const line = lines[i];
    if (!line) continue;
    if (/^Q\d+:/i.test(line)){
      if (cur.question) qs.push({...cur});
      cur = emptyQ();
      cur.question = line.replace(/^Q\d+:\s*/i, "");
    } else if (/^[A-D]\)/i.test(line)){
      cur.options.push(line);
    } else if (/^Answer:/i.test(line)){
      cur.answer = line.split(":")[1].trim().toUpperCase();
    } else if (/^Explanation:/i.test(line)){
      cur.explanation = line.replace(/^Explanation:\s*/i, "");
    } else {
      // allow multi-line explanation continuation
      if (cur.explanation){
        cur.explanation += " " + line;
      }
    }
  }
  if (cur.question) qs.push(cur);
  // basic validation
  return qs.filter(q => q.question && q.options.length >= 2 && /[A-D]/.test(q.answer));
}
function emptyQ(){ return {question:"", options:[], answer:"", explanation:""}; }

function escapeHtml(s){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
