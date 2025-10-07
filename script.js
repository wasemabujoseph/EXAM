document.getElementById("generate-btn").addEventListener("click", generateExam);
document.getElementById("submit-btn").addEventListener("click", submitExam);
document.getElementById("retry-btn").addEventListener("click", retryExam);

let mcqData = [];

function generateExam() {
  const input = document.getElementById("mcq-input").value.trim();
  if (!input) return alert("Please paste your MCQs first!");

  const lines = input.split("\n").map(l => l.trim()).filter(l => l);
  mcqData = parseMCQs(lines);
  renderExam(mcqData);

  document.getElementById("input-section").classList.add("hidden");
  document.getElementById("exam-section").classList.remove("hidden");
}

function parseMCQs(lines) {
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
      div.appendChild(document.createElement("br"));
    });

    form.appendChild(div);
  });
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
  document.getElementById("exam-section").classList.add("hidden");
  document.getElementById("result-section").classList.remove("hidden");

  document.getElementById("score").innerText = `Your Score: ${scorePercent}% (${results.filter(r => r.isCorrect).length}/${results.length})`;

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

  const weakCount = results.filter(r => !r.isCorrect).length;
  const strongCount = results.filter(r => r.isCorrect).length;
  const summary = document.createElement("p");
  summary.innerHTML = `<br><strong>Summary:</strong> ${strongCount} strong areas, ${weakCount} weak areas.`;
  analysis.appendChild(summary);
}

function retryExam() {
  document.getElementById("result-section").classList.add("hidden");
  document.getElementById("exam-section").classList.remove("hidden");
}
