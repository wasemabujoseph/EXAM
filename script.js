document.getElementById("generate-btn").addEventListener("click", generateExam);
document.getElementById("submit-btn").addEventListener("click", submitExam);
document.getElementById("retry-btn").addEventListener("click", retryExam);
document.getElementById("back-btn").addEventListener("click", goBack);

let mcqData = [];

function generateExam() {
  const input = document.getElementById("mcq-input").value.trim();
  if (!input) return alert("Please paste your MCQs first!");
  mcqData = parseMCQs(input);
  if (!mcqData.length) return alert("Invalid format. Please check your input.");

  renderExam(mcqData);
  toggleSection("input", "exam");
}

function parseMCQs(input) {
  const lines = input.split("\n").map(l => l.trim()).filter(l => l);
  const questions = [];
  let current = { question: "", options: [], answer: "" };

  for (const line of lines) {
    if (line.match(/^Q\d+:/i)) {
      if (current.question) questions.push({ ...current });
      current = { question: line.replace(/^Q\d+:\s*/i, ""), options: [], answer: "" };
    } else if (line.match(/^[A-D]\)/i)) {
      current.options.push(line);
    } else if (line.match(/^Answer:/i)) {
      current.answer = line.split(":")[1].trim().toUpperCase();
    }
  }
  if (current.question) questions.push(current);
  return questions;
}

function renderExam(questions) {
  const form = document.getElementById("exam-form");
  form.innerHTML = "";
  questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question";
    const qText = document.createElement("p");
    qText.innerHTML = `<strong>Q${i + 1}:</strong> ${q.question}`;
    div.appendChild(qText);

    q.options.forEach(opt => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${i}`;
      input.value = opt[0].toUpperCase();
      label.appendChild(input);
      label.append(` ${opt}`);
      div.appendChild(label);
    });

    form.appendChild(div);
  });

  updateProgress(0);
}

function submitExam() {
  const form = document.getElementById("exam-form");
  const results = [];
  let correct = 0;

  mcqData.forEach((q, i) => {
    const selected = form.querySelector(`input[name="q${i}"]:checked`);
    const answer = selected ? selected.value : null;
    const isCorrect = answer === q.answer;
    if (isCorrect) correct++;
    results.push({ ...q, selected: answer, isCorrect });
  });

  const scorePercent = Math.round((correct / mcqData.length) * 100);
  displayResults(results, scorePercent);
}

function displayResults(results, scorePercent) {
  toggleSection("exam", "result");
  document.getElementById("score").innerHTML = `Your Score: ${scorePercent}% (${results.filter(r => r.isCorrect).length}/${results.length})`;

  const analysis = document.getElementById("analysis");
  analysis.innerHTML = "";

  results.forEach((r, i) => {
    const p = document.createElement("p");
    p.innerHTML = `<strong>Q${i + 1}:</strong> ${r.question}<br>
      Your Answer: ${r.selected || "None"}<br>
      Correct Answer: ${r.answer}<br>
      <span class="${r.isCorrect ? "result-correct" : "result-wrong"}">
      ${r.isCorrect ? "✔ Correct" : "✘ Wrong"}
      </span>`;
    analysis.appendChild(p);
  });
}

function retryExam() {
  document.querySelectorAll("input[type='radio']").forEach(el => (el.checked = false));
  toggleSection("result", "exam");
  updateProgress(0);
}

function goBack() {
  toggleSection("result", "input");
}

function toggleSection(hide, show) {
  document.getElementById(`${hide}-section`).classList.add("hidden");
  document.getElementById(`${show}-section`).classList.remove("hidden");
}

function updateProgress(value) {
  const fill = document.querySelector(".progress-fill");
  fill.style.width = value + "%";
}
