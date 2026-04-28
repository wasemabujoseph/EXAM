(() => {
  "use strict";

  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const STORE = {
    theme: "exam.theme.v2",
    saved: "exam.savedExams.v2",
    student: "exam.student.v2",
    attempt: "exam.autosavedAttempt.v2"
  };

  const state = {
    repoExams: [],
    activeExam: null,
    questions: [],
    attempt: [],
    flags: new Set(),
    notes: {},
    settings: {},
    startedAt: 0,
    submittedAt: 0,
    limitMs: 0,
    timerId: null,
    reviewMode: false,
    lastResults: null,
    toastId: null
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    els.year.textContent = new Date().getFullYear();
    initTheme();
    bindEvents();
    loadStudent();
    renderSavedExams();
    updateRestoreButton();
    updatePasteStats();
    loadRepositoryExams().then(handleDeepLink);
  }

  function cacheElements() {
    const ids = [
      "restore-attempt-btn", "theme-toggle", "repo-count", "saved-count", "parse-count",
      "student-name", "time-limit", "max-questions", "review-mode", "shuffle-questions",
      "shuffle-answers", "remember-student", "import-btn", "refresh-repo-btn", "repo-status",
      "repo-exam-list", "paste-title", "paste-id", "mcq-input", "start-paste-btn",
      "save-paste-btn", "preview-paste-btn", "download-json-btn", "export-saved-btn",
      "clear-saved-btn", "saved-exam-list", "quality-status", "quality-questions",
      "quality-answers", "quality-format", "preview-box", "home-view", "exam-view",
      "results-view", "exam-kicker", "exam-title", "exam-meta", "timer-pill",
      "exit-exam-btn", "submit-exam-btn", "progress-fill", "progress-label",
      "answered-label", "exam-form", "question-nav", "next-unanswered-btn",
      "score-ring", "score-percent", "score-line", "results-meta", "review-exam-btn",
      "retake-btn", "retry-wrong-btn", "print-results-btn", "export-report-btn",
      "export-review-btn", "export-key-btn", "result-total", "result-correct",
      "result-wrong", "result-time", "review-list", "file-input", "toast", "year"
    ];

    ids.forEach((id) => {
      const key = id.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      els[key] = document.getElementById(id);
    });

    els.tabs = Array.from(document.querySelectorAll(".tab"));
    els.tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
  }

  function bindEvents() {
    els.themeToggle.addEventListener("click", toggleTheme);
    els.restoreAttemptBtn.addEventListener("click", restoreAttempt);
    els.importBtn.addEventListener("click", () => els.fileInput.click());
    els.fileInput.addEventListener("change", handleImport);
    els.refreshRepoBtn.addEventListener("click", loadRepositoryExams);

    els.tabs.forEach((tab) => {
      tab.addEventListener("click", () => setTab(tab.dataset.tab));
    });

    els.mcqInput.addEventListener("input", debounce(updatePasteStats, 250));
    els.previewPasteBtn.addEventListener("click", () => updatePasteStats(true));
    els.startPasteBtn.addEventListener("click", startPastedExam);
    els.savePasteBtn.addEventListener("click", savePastedExam);
    els.downloadJsonBtn.addEventListener("click", downloadPastedJson);

    els.exportSavedBtn.addEventListener("click", exportSavedExams);
    els.clearSavedBtn.addEventListener("click", clearSavedExams);

    els.studentName.addEventListener("input", persistStudent);
    els.rememberStudent.addEventListener("change", persistStudent);

    els.submitExamBtn.addEventListener("click", () => submitExam());
    els.exitExamBtn.addEventListener("click", exitExam);
    els.nextUnansweredBtn.addEventListener("click", jumpToNextUnanswered);

    els.reviewExamBtn.addEventListener("click", reviewSubmittedExam);
    els.retakeBtn.addEventListener("click", retakeExam);
    els.retryWrongBtn.addEventListener("click", retryWrongQuestions);
    els.printResultsBtn.addEventListener("click", () => window.print());
    els.exportReportBtn.addEventListener("click", exportAttemptReport);
    els.exportReviewBtn.addEventListener("click", exportReviewText);
    els.exportKeyBtn.addEventListener("click", exportAnswerKey);

    document.addEventListener("keydown", handleKeyboard);
  }

  function initTheme() {
    const saved = localStorage.getItem(STORE.theme);
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(saved || preferred);
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme || "light";
    applyTheme(current === "dark" ? "light" : "dark");
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORE.theme, theme);
    els.themeToggle.querySelector("span").textContent = theme === "dark" ? "Light" : "Dark";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#151517" : "#f6f7fb");
  }

  function loadStudent() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE.student) || "{}");
      if (saved.name) els.studentName.value = saved.name;
      if (typeof saved.remember === "boolean") els.rememberStudent.checked = saved.remember;
    } catch {
      localStorage.removeItem(STORE.student);
    }
  }

  function persistStudent() {
    if (!els.rememberStudent.checked) {
      localStorage.removeItem(STORE.student);
      return;
    }

    localStorage.setItem(STORE.student, JSON.stringify({
      name: els.studentName.value.trim(),
      remember: true
    }));
  }

  async function loadRepositoryExams() {
    els.repoStatus.textContent = "Loading repository exams...";
    els.repoExamList.innerHTML = "";

    try {
      const response = await fetch("exams/index.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Manifest returned ${response.status}`);

      const manifest = await response.json();
      state.repoExams = Array.isArray(manifest.exams) ? manifest.exams : [];
      renderRepoExams();
      return state.repoExams;
    } catch (error) {
      state.repoExams = [];
      els.repoCount.textContent = "0";
      els.repoStatus.textContent = "Repository exams could not be loaded. The pasted and saved exam tools still work.";
      showToast(error.message || "Repository load failed");
      return [];
    }
  }

  function renderRepoExams() {
    els.repoCount.textContent = String(state.repoExams.length);
    els.repoExamList.innerHTML = "";

    if (!state.repoExams.length) {
      els.repoStatus.textContent = "No repository exams are listed yet.";
      return;
    }

    els.repoStatus.textContent = "Repository exams are ready.";
    state.repoExams.forEach((meta) => {
      const card = document.createElement("article");
      card.className = "exam-card";

      const copy = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = meta.title || meta.id || "Untitled exam";
      const description = document.createElement("p");
      description.textContent = meta.description || "Hosted exam";
      const info = document.createElement("div");
      info.className = "exam-card-meta";
      info.append(makePill(meta.id || "repo"), makePill(meta.file || "json"));
      copy.append(title, description, info);

      const actions = document.createElement("div");
      actions.className = "action-row";
      actions.append(
        makeButton("Start", "button button-primary", () => startRepositoryExam(meta)),
        makeButton("Save", "button", () => saveRepositoryExam(meta)),
        makeButton("Link", "button button-soft", () => copyRepoLink(meta))
      );

      card.append(copy, actions);
      els.repoExamList.append(card);
    });
  }

  async function startRepositoryExam(meta) {
    try {
      const exam = await fetchRepositoryExam(meta);
      startExam(exam);
    } catch (error) {
      showToast(error.message || "Could not start exam");
    }
  }

  async function saveRepositoryExam(meta) {
    try {
      const exam = await fetchRepositoryExam(meta);
      saveExamLocally(exam);
    } catch (error) {
      showToast(error.message || "Could not save exam");
    }
  }

  async function fetchRepositoryExam(meta) {
    const file = normalizeRelativePath(meta.file || `${meta.id}.json`);
    const response = await fetch(`exams/${file}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Exam file returned ${response.status}`);
    const data = await response.json();
    return normalizeExam(data, meta);
  }

  function copyRepoLink(meta) {
    const id = encodeURIComponent(meta.id || "");
    copyText(`${location.origin}${location.pathname}?exam=${id}`);
  }

  function startPastedExam() {
    const exam = readPastedExam();
    if (exam) startExam(exam);
  }

  function savePastedExam() {
    const exam = readPastedExam();
    if (exam) saveExamLocally(exam);
  }

  function downloadPastedJson() {
    const exam = readPastedExam();
    if (!exam) return;
    downloadJson(`${exam.id || "exam"}.json`, compactExam(exam));
  }

  function readPastedExam(options = {}) {
    const silent = Boolean(options.silent);
    const raw = els.mcqInput.value.trim();

    if (!raw) {
      if (!silent) showToast("Paste MCQs or import a file first.");
      return null;
    }

    try {
      let exam;
      if (looksLikeJson(raw)) {
        exam = normalizeExam(JSON.parse(raw), {
          title: els.pasteTitle.value.trim(),
          id: els.pasteId.value.trim()
        });
      } else {
        const parsed = parsePlainText(raw);
        exam = normalizeExam({
          id: els.pasteId.value.trim(),
          title: els.pasteTitle.value.trim() || "Custom MCQ Exam",
          description: "Created from pasted MCQs.",
          questions: parsed
        });
      }

      return exam;
    } catch (error) {
      if (!silent) showToast(error.message || "Could not parse this exam.");
      return null;
    }
  }

  function updatePasteStats(forceToast = false) {
    const exam = readPastedExam({ silent: true });
    if (!exam) {
      updateQuality(null, "Waiting", "Ready");
      if (forceToast) showToast("No valid questions found yet.");
      return;
    }

    updateQuality(exam, "Valid", looksLikeJson(els.mcqInput.value.trim()) ? "JSON" : "Text");
    if (forceToast) showToast(`${exam.questions.length} question(s) are ready.`);
  }

  async function handleImport(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      let text = "";

      if (ext === "docx") {
        text = await readDocx(file);
      } else {
        text = await file.text();
      }

      if (ext === "json" || looksLikeJson(text.trim())) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.savedExams)) {
          importSavedExamBundle(parsed.savedExams);
          setTab("saved");
          return;
        }

        const exam = normalizeExam(parsed, { title: file.name.replace(/\.[^.]+$/, "") });
        els.pasteTitle.value = exam.title;
        els.pasteId.value = exam.id;
        els.mcqInput.value = toPlainText(exam);
        updateQuality(exam, "Valid", "JSON");
        setTab("paste");
        showToast("Exam imported.");
        return;
      }

      els.pasteTitle.value = file.name.replace(/\.[^.]+$/, "");
      els.pasteId.value = sanitizeId(els.pasteTitle.value);
      els.mcqInput.value = extractSepBlock(text) || text;
      setTab("paste");
      updatePasteStats(true);
    } catch (error) {
      showToast(error.message || "Import failed.");
    } finally {
      event.target.value = "";
    }
  }

  async function readDocx(file) {
    if (!window.mammoth) {
      throw new Error("DOCX import needs the Mammoth browser library. Try a TXT export if the CDN is unavailable.");
    }

    const arrayBuffer = await file.arrayBuffer();
    if (typeof window.mammoth.extractRawText === "function") {
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      return result.value || "";
    }

    const result = await window.mammoth.convertToHtml({ arrayBuffer });
    return stripHtml(result.value || "");
  }

  function getSavedExams() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE.saved) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      localStorage.removeItem(STORE.saved);
      return [];
    }
  }

  function setSavedExams(exams) {
    localStorage.setItem(STORE.saved, JSON.stringify(exams));
    renderSavedExams();
  }

  function saveExamLocally(exam) {
    const normalized = compactExam(normalizeExam(exam));
    const saved = getSavedExams();
    const index = saved.findIndex((item) => item.id === normalized.id);
    normalized.savedAt = new Date().toISOString();

    if (index >= 0) saved[index] = normalized;
    else saved.unshift(normalized);

    setSavedExams(saved);
    showToast("Exam saved locally.");
  }

  function renderSavedExams() {
    const saved = getSavedExams();
    els.savedCount.textContent = String(saved.length);
    els.savedExamList.innerHTML = "";

    if (!saved.length) {
      const empty = document.createElement("div");
      empty.className = "inline-status";
      empty.textContent = "No saved exams yet.";
      els.savedExamList.append(empty);
      return;
    }

    saved.forEach((exam) => {
      const normalized = normalizeExam(exam);
      const card = document.createElement("article");
      card.className = "exam-card";

      const copy = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = normalized.title;
      const description = document.createElement("p");
      description.textContent = normalized.description || "Saved on this device.";
      const info = document.createElement("div");
      info.className = "exam-card-meta";
      info.append(makePill(`${normalized.questions.length} questions`), makePill(normalized.id));
      copy.append(title, description, info);

      const actions = document.createElement("div");
      actions.className = "action-row";
      actions.append(
        makeButton("Start", "button button-primary", () => startExam(normalized)),
        makeButton("Export", "button", () => downloadJson(`${normalized.id}.json`, compactExam(normalized))),
        makeButton("Link", "button button-soft", () => copySavedLink(normalized.id)),
        makeButton("Delete", "button button-danger", () => deleteSavedExam(normalized.id))
      );

      card.append(copy, actions);
      els.savedExamList.append(card);
    });
  }

  function copySavedLink(id) {
    copyText(`${location.origin}${location.pathname}?saved=${encodeURIComponent(id)}`);
  }

  function deleteSavedExam(id) {
    const saved = getSavedExams().filter((exam) => exam.id !== id);
    setSavedExams(saved);
    showToast("Saved exam deleted.");
  }

  function exportSavedExams() {
    const saved = getSavedExams();
    if (!saved.length) {
      showToast("There are no saved exams to export.");
      return;
    }
    downloadJson("exam-saved-exams.json", { exportedAt: new Date().toISOString(), savedExams: saved });
  }

  function clearSavedExams() {
    if (!getSavedExams().length) {
      showToast("There are no saved exams to delete.");
      return;
    }
    if (!confirm("Delete all saved exams from this browser?")) return;
    setSavedExams([]);
    showToast("All saved exams deleted.");
  }

  function importSavedExamBundle(items) {
    const incoming = items.map((item) => compactExam(normalizeExam(item)));
    const current = getSavedExams();
    const map = new Map(current.map((item) => [item.id, item]));
    incoming.forEach((item) => map.set(item.id, { ...item, savedAt: new Date().toISOString() }));
    setSavedExams(Array.from(map.values()));
    showToast(`${incoming.length} saved exam(s) imported.`);
  }

  function startExam(exam) {
    const normalized = normalizeExam(exam);
    const settings = readSettings();
    persistStudent();

    let questions = clone(normalized.questions);
    if (settings.shuffleQuestions) questions = shuffle(questions);
    if (settings.maxQuestions > 0) questions = questions.slice(0, settings.maxQuestions);
    questions = questions.map((question) => prepareQuestion(question, settings.shuffleAnswers));

    if (!questions.length) {
      showToast("This exam has no valid questions.");
      return;
    }

    clearTimer();
    state.activeExam = normalized;
    state.questions = questions;
    state.attempt = questions.map(() => new Set());
    state.flags = new Set();
    state.notes = {};
    state.settings = settings;
    state.startedAt = Date.now();
    state.submittedAt = 0;
    state.limitMs = settings.timeLimitMinutes * 60000;
    state.reviewMode = settings.reviewMode === "instant";
    state.lastResults = null;

    renderExam();
    showView("exam");
    startTimer();
    saveAttempt();
  }

  function readSettings() {
    return {
      studentName: els.studentName.value.trim(),
      timeLimitMinutes: Math.max(0, Number.parseInt(els.timeLimit.value, 10) || 0),
      maxQuestions: Math.max(0, Number.parseInt(els.maxQuestions.value, 10) || 0),
      reviewMode: els.reviewMode.value,
      shuffleQuestions: els.shuffleQuestions.checked,
      shuffleAnswers: els.shuffleAnswers.checked
    };
  }

  function prepareQuestion(question, shuffleAnswers) {
    const options = question.options.map((option, index) => ({
      id: String(option.id),
      label: option.label || toLetter(index),
      text: option.text
    }));

    const ordered = shuffleAnswers ? shuffle(options) : options.slice();
    return {
      ...question,
      options: ordered.map((option, index) => ({ ...option, display: toLetter(index) })),
      answers: question.answers.map(String)
    };
  }

  function renderExam() {
    const student = state.settings.studentName || "Student";
    els.examTitle.textContent = state.activeExam.title;
    els.examKicker.textContent = state.submittedAt ? "Review mode" : "Attempt mode";
    els.examMeta.textContent = `${student} - ${state.questions.length} question(s)`;
    els.submitExamBtn.hidden = Boolean(state.submittedAt);
    els.timerPill.classList.toggle("hidden", !state.limitMs || Boolean(state.submittedAt));
    els.examForm.classList.toggle("is-reviewing", state.reviewMode || Boolean(state.submittedAt));
    els.examForm.innerHTML = "";
    els.questionNav.innerHTML = "";

    const fragment = document.createDocumentFragment();
    state.questions.forEach((question, index) => {
      fragment.append(createQuestionCard(question, index));
      els.questionNav.append(createNavButton(index));
    });

    els.examForm.append(fragment);
    updateProgress();
    syncQuestionNav();
  }

  function createQuestionCard(question, index) {
    const card = document.createElement("article");
    card.className = "question-card";
    card.dataset.index = String(index);
    card.dir = "auto";

    const head = document.createElement("div");
    head.className = "question-head";

    const title = document.createElement("h2");
    title.textContent = `Q${index + 1}: ${question.text}`;

    const headActions = document.createElement("div");
    headActions.className = "action-row";
    const type = makePill(question.answers.length > 1 ? "Multiple" : "Single");
    const flag = makeButton(state.flags.has(index) ? "Flagged" : "Flag", "button button-soft", () => {
      if (state.flags.has(index)) state.flags.delete(index);
      else state.flags.add(index);
      syncQuestionNav();
      flag.textContent = state.flags.has(index) ? "Flagged" : "Flag";
      scheduleAttemptSave();
    });
    headActions.append(type, flag);
    head.append(title, headActions);

    const optionList = document.createElement("div");
    optionList.className = "option-list";
    const isMultiple = question.answers.length > 1;

    question.options.forEach((option) => {
      const row = document.createElement("label");
      row.className = "option-row";
      row.dataset.optionId = option.id;
      row.dir = "auto";

      const input = document.createElement("input");
      input.type = isMultiple ? "checkbox" : "radio";
      input.name = `question-${index}`;
      input.value = option.id;
      input.checked = state.attempt[index].has(option.id);
      input.disabled = Boolean(state.submittedAt);
      input.addEventListener("change", () => updateAnswer(index, option.id, input.checked));

      const badge = document.createElement("span");
      badge.className = "option-badge";
      badge.textContent = option.display;

      const text = document.createElement("span");
      text.className = "option-text";
      text.textContent = option.text;

      row.append(input, badge, text);
      optionList.append(row);
    });

    const tools = document.createElement("div");
    tools.className = "question-tools";
    const note = document.createElement("textarea");
    note.className = "note-input";
    note.placeholder = "Private note";
    note.value = state.notes[index] || "";
    note.disabled = Boolean(state.submittedAt);
    note.addEventListener("input", () => {
      state.notes[index] = note.value;
      scheduleAttemptSave();
    });
    tools.append(note);

    if (question.explanation) {
      const explanation = document.createElement("div");
      explanation.className = "explanation";
      explanation.textContent = `Explanation: ${question.explanation}`;
      tools.append(explanation);
    }

    card.append(head, optionList, tools);
    requestAnimationFrame(() => applyQuestionState(index));
    return card;
  }

  function createNavButton(index) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(index + 1);
    button.addEventListener("click", () => {
      const card = els.examForm.querySelector(`[data-index="${index}"]`);
      if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return button;
  }

  function updateAnswer(index, optionId, checked) {
    const question = state.questions[index];
    const isMultiple = question.answers.length > 1;

    if (isMultiple) {
      if (checked) state.attempt[index].add(optionId);
      else state.attempt[index].delete(optionId);
    } else {
      state.attempt[index].clear();
      if (checked) state.attempt[index].add(optionId);
    }

    updateProgress();
    syncQuestionNav();
    applyQuestionState(index);
    scheduleAttemptSave();
  }

  function applyQuestionState(index) {
    const question = state.questions[index];
    const card = els.examForm.querySelector(`[data-index="${index}"]`);
    if (!question || !card) return;

    const reveal = state.reviewMode || Boolean(state.submittedAt);
    const expected = new Set(question.answers);
    card.querySelectorAll(".option-row").forEach((row) => {
      const id = row.dataset.optionId;
      const selected = state.attempt[index].has(id);
      const correct = expected.has(id);
      row.classList.toggle("is-selected", selected);
      row.classList.toggle("is-correct", reveal && correct);
      row.classList.toggle("is-wrong", reveal && selected && !correct);
    });
  }

  function updateProgress() {
    const answered = state.attempt.filter((set) => set.size > 0).length;
    const total = Math.max(1, state.questions.length);
    const percent = Math.round((answered / total) * 100);
    els.progressFill.style.width = `${percent}%`;
    els.progressLabel.textContent = `${percent}%`;
    els.answeredLabel.textContent = `${answered} answered`;
  }

  function syncQuestionNav() {
    Array.from(els.questionNav.children).forEach((button, index) => {
      button.classList.toggle("is-done", state.attempt[index] && state.attempt[index].size > 0);
      button.classList.toggle("is-flagged", state.flags.has(index));
    });
  }

  function jumpToNextUnanswered() {
    const index = state.attempt.findIndex((set) => set.size === 0);
    if (index === -1) {
      showToast("Every question has an answer.");
      return;
    }
    const card = els.examForm.querySelector(`[data-index="${index}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startTimer() {
    if (!state.limitMs) {
      els.timerPill.classList.add("hidden");
      return;
    }

    els.timerPill.classList.remove("hidden");
    tickTimer();
    state.timerId = window.setInterval(tickTimer, 1000);
  }

  function tickTimer() {
    const elapsed = Date.now() - state.startedAt;
    const remaining = Math.max(0, state.limitMs - elapsed);
    els.timerPill.textContent = formatDuration(remaining);

    if (remaining <= 0) {
      submitExam({ auto: true });
    }
  }

  function clearTimer() {
    if (state.timerId) {
      window.clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function submitExam(options = {}) {
    if (!state.questions.length || state.submittedAt) return;

    const unanswered = state.attempt.filter((set) => set.size === 0).length;
    if (!options.auto && unanswered > 0 && !confirm(`${unanswered} question(s) are unanswered. Submit anyway?`)) {
      return;
    }

    clearTimer();
    state.submittedAt = Date.now();
    state.reviewMode = true;
    state.lastResults = gradeAttempt();
    renderResults();
    saveAttempt();
    showView("results");

    if (options.auto) showToast("Time is up. The exam was submitted.");
  }

  function gradeAttempt() {
    const items = state.questions.map((question, index) => {
      const selected = Array.from(state.attempt[index]);
      const correct = setEquals(new Set(question.answers), state.attempt[index]);
      return { question, selected, correct, note: state.notes[index] || "" };
    });

    const correctCount = items.filter((item) => item.correct).length;
    return {
      title: state.activeExam.title,
      studentName: state.settings.studentName || "Student",
      total: items.length,
      correct: correctCount,
      wrong: items.length - correctCount,
      percent: Math.round((correctCount / Math.max(1, items.length)) * 100),
      timeMs: (state.submittedAt || Date.now()) - state.startedAt,
      items
    };
  }

  function renderResults() {
    const results = state.lastResults;
    if (!results) return;

    const degree = Math.round((results.percent / 100) * 360);
    els.scoreRing.style.background = `conic-gradient(var(--success) ${degree}deg, var(--surface-3) 0deg)`;
    els.scorePercent.textContent = `${results.percent}%`;
    els.scoreLine.textContent = `Score: ${results.correct} / ${results.total}`;
    els.resultsMeta.textContent = `${results.studentName} - ${results.title}`;
    els.resultTotal.textContent = String(results.total);
    els.resultCorrect.textContent = String(results.correct);
    els.resultWrong.textContent = String(results.wrong);
    els.resultTime.textContent = formatDuration(results.timeMs);

    els.reviewList.innerHTML = "";
    results.items.forEach((item, index) => {
      els.reviewList.append(createReviewCard(item, index));
    });
  }

  function createReviewCard(item, index) {
    const card = document.createElement("article");
    card.className = "review-card";
    card.dir = "auto";

    const title = document.createElement("h2");
    title.textContent = `Q${index + 1}: ${item.question.text}`;
    card.append(title);

    item.question.options.forEach((option) => {
      const row = document.createElement("div");
      row.className = "review-option";
      row.classList.toggle("is-correct", item.question.answers.includes(option.id));
      row.classList.toggle("is-selected", item.selected.includes(option.id));

      const badge = document.createElement("span");
      badge.className = "option-badge";
      badge.textContent = option.display;

      const text = document.createElement("span");
      text.className = "option-text";
      text.textContent = option.text;

      const tag = document.createElement("span");
      tag.className = "review-tag";
      if (item.question.answers.includes(option.id) && item.selected.includes(option.id)) tag.textContent = "Correct";
      else if (item.question.answers.includes(option.id)) tag.textContent = "Answer";
      else if (item.selected.includes(option.id)) tag.textContent = "Selected";

      row.append(badge, text, tag);
      card.append(row);
    });

    const summary = document.createElement("p");
    summary.className = item.correct ? "review-tag" : "review-tag";
    summary.textContent = item.correct ? "Result: Correct" : `Result: Wrong - correct answer: ${answerLabels(item.question).join(" & ")}`;
    card.append(summary);

    if (item.question.explanation) {
      const explanation = document.createElement("div");
      explanation.className = "explanation";
      explanation.style.display = "block";
      explanation.textContent = `Explanation: ${item.question.explanation}`;
      card.append(explanation);
    }

    if (item.note) {
      const note = document.createElement("p");
      note.textContent = `Note: ${item.note}`;
      card.append(note);
    }

    return card;
  }

  function reviewSubmittedExam() {
    if (!state.lastResults) return;
    state.reviewMode = true;
    renderExam();
    showView("exam");
  }

  function retakeExam() {
    if (!state.activeExam) return;
    startExam(state.activeExam);
  }

  function retryWrongQuestions() {
    if (!state.lastResults) {
      showToast("Submit an exam before retrying wrong answers.");
      return;
    }

    const wrong = state.lastResults.items.filter((item) => !item.correct);
    if (!wrong.length) {
      showToast("There are no wrong answers to retry.");
      return;
    }

    startExam({
      id: `${state.activeExam.id}-retry`,
      title: `${state.activeExam.title} - Retry Wrong`,
      description: "Retry set generated from incorrect answers.",
      questions: wrong.map((item) => cleanQuestion(item.question))
    });
  }

  function exitExam() {
    if (!state.submittedAt && state.attempt.some((set) => set.size > 0)) {
      if (!confirm("Leave this attempt and return to the workspace?")) return;
    }
    clearTimer();
    showView(state.submittedAt && state.lastResults ? "results" : "home");
  }

  function exportAttemptReport() {
    if (!state.lastResults) {
      showToast("Submit an exam before exporting a report.");
      return;
    }

    downloadJson("exam-attempt-report.json", {
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      results: {
        title: state.lastResults.title,
        studentName: state.lastResults.studentName,
        total: state.lastResults.total,
        correct: state.lastResults.correct,
        wrong: state.lastResults.wrong,
        percent: state.lastResults.percent,
        timeMs: state.lastResults.timeMs
      },
      answers: state.lastResults.items.map((item, index) => ({
        index: index + 1,
        question: item.question.text,
        selected: item.selected.map((id) => labelForId(item.question, id)),
        correctAnswers: answerLabels(item.question),
        correct: item.correct,
        note: item.note
      }))
    });
  }

  function exportReviewText() {
    if (!state.lastResults) {
      showToast("Submit an exam before exporting review text.");
      return;
    }

    const lines = [
      state.lastResults.title,
      `Student: ${state.lastResults.studentName}`,
      `Score: ${state.lastResults.correct} / ${state.lastResults.total} (${state.lastResults.percent}%)`,
      ""
    ];

    state.lastResults.items.forEach((item, index) => {
      lines.push(`Q${index + 1}: ${item.question.text}`);
      item.question.options.forEach((option) => lines.push(`${option.display}) ${option.text}`));
      lines.push(`Selected: ${item.selected.map((id) => labelForId(item.question, id)).join(" & ") || "None"}`);
      lines.push(`Correct: ${answerLabels(item.question).join(" & ")}`);
      if (item.question.explanation) lines.push(`Explanation: ${item.question.explanation}`);
      lines.push("");
    });

    downloadText("exam-review.txt", lines.join("\n"));
  }

  function exportAnswerKey() {
    if (!state.questions.length) {
      showToast("Start an exam before exporting an answer key.");
      return;
    }

    const rows = [["index", "question", "answers"]];
    state.questions.forEach((question, index) => {
      rows.push([String(index + 1), question.text, answerLabels(question).join(" & ")]);
    });
    downloadText("answer-key.csv", rows.map((row) => row.map(csvCell).join(",")).join("\n"));
  }

  function saveAttempt() {
    if (!state.activeExam || !state.questions.length) return;

    const payload = {
      activeExam: compactExam(state.activeExam),
      questions: state.questions.map(cleanQuestion),
      attempt: state.attempt.map((set) => Array.from(set)),
      flags: Array.from(state.flags),
      notes: state.notes,
      settings: state.settings,
      startedAt: state.startedAt,
      submittedAt: state.submittedAt,
      limitMs: state.limitMs,
      reviewMode: state.reviewMode,
      lastResults: null,
      savedAt: Date.now()
    };

    localStorage.setItem(STORE.attempt, JSON.stringify(payload));
    updateRestoreButton();
  }

  let saveTimer = null;
  function scheduleAttemptSave() {
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveTimer = null;
      saveAttempt();
    }, 350);
  }

  function restoreAttempt() {
    try {
      const raw = localStorage.getItem(STORE.attempt);
      if (!raw) {
        showToast("No draft attempt is available.");
        return;
      }

      const payload = JSON.parse(raw);
      clearTimer();
      state.activeExam = normalizeExam(payload.activeExam);
      state.questions = payload.questions.map((question) => prepareQuestion(normalizeQuestion(question), false));
      state.attempt = payload.attempt.map((items) => new Set(items.map(String)));
      state.flags = new Set((payload.flags || []).map(Number));
      state.notes = payload.notes || {};
      state.settings = payload.settings || readSettings();
      state.startedAt = payload.startedAt || Date.now();
      state.submittedAt = payload.submittedAt || 0;
      state.limitMs = payload.limitMs || 0;
      state.reviewMode = Boolean(payload.reviewMode || payload.submittedAt);
      state.lastResults = state.submittedAt ? gradeAttempt() : null;

      if (state.submittedAt) {
        renderResults();
        showView("results");
      } else {
        renderExam();
        showView("exam");
        startTimer();
      }
    } catch (error) {
      localStorage.removeItem(STORE.attempt);
      updateRestoreButton();
      showToast(error.message || "Draft could not be restored.");
    }
  }

  function updateRestoreButton() {
    els.restoreAttemptBtn.hidden = !localStorage.getItem(STORE.attempt);
  }

  function showView(name) {
    els.homeView.classList.toggle("hidden", name !== "home");
    els.examView.classList.toggle("hidden", name !== "exam");
    els.resultsView.classList.toggle("hidden", name !== "results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setTab(name) {
    els.tabs.forEach((tab) => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    els.tabPanels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.id !== `panel-${name}`);
    });
  }

  async function handleDeepLink() {
    const params = new URLSearchParams(location.search);
    const examId = params.get("exam");
    const savedId = params.get("saved");

    if (savedId) {
      const saved = getSavedExams().find((exam) => exam.id === savedId);
      if (saved) {
        setTab("saved");
        startExam(saved);
      } else {
        showToast("Saved exam link was not found on this device.");
      }
      return;
    }

    if (examId) {
      const meta = state.repoExams.find((exam) => exam.id === examId);
      if (!meta) {
        showToast("Repository exam link was not found.");
        return;
      }

      await startRepositoryExam(meta);
    }
  }

  function updateQuality(exam, status, format) {
    const questionCount = exam ? exam.questions.length : 0;
    const answered = exam ? exam.questions.filter((question) => question.answers.length > 0).length : 0;
    els.parseCount.textContent = String(questionCount);
    els.qualityStatus.textContent = status;
    els.qualityQuestions.textContent = String(questionCount);
    els.qualityAnswers.textContent = String(answered);
    els.qualityFormat.textContent = format;

    if (!exam) {
      els.previewBox.textContent = "Paste or load an exam to see a preview.";
      return;
    }

    const first = exam.questions[0];
    els.previewBox.textContent = [
      exam.title,
      `${exam.questions.length} question(s)`,
      "",
      `Q1: ${first.text}`,
      ...first.options.slice(0, 4).map((option, index) => `${toLetter(index)}) ${option.text}`),
      `Answer: ${answerLabels(first).join(" & ")}`
    ].join("\n");
  }

  function normalizeExam(input, fallback = {}) {
    if (!input) throw new Error("Exam data is empty.");

    const rawQuestions = Array.isArray(input) ? input : input.questions;
    if (!Array.isArray(rawQuestions)) throw new Error("Exam must include a questions array.");

    const questions = rawQuestions.map((question, index) => normalizeQuestion(question, index)).filter(Boolean);
    if (!questions.length) throw new Error("No valid questions were found.");

    const title = cleanText(input.title || fallback.title || "Untitled Exam");
    return {
      id: sanitizeId(input.id || fallback.id || title),
      title,
      description: cleanText(input.description || fallback.description || ""),
      questions
    };
  }

  function normalizeQuestion(question, index = 0) {
    if (!question) return null;

    const text = cleanText(question.text || question.question || question.stem || "");
    const rawOptions = Array.isArray(question.options) ? question.options : question.choices;
    if (!text || !Array.isArray(rawOptions) || rawOptions.length < 2) return null;

    const options = rawOptions.map((option, optionIndex) => normalizeOption(option, optionIndex)).filter(Boolean);
    if (options.length < 2) return null;

    const rawAnswer = question.answers ?? question.answer ?? question.correctAnswers ?? question.correct ?? question.correctIndex;
    const answers = normalizeAnswers(rawAnswer, options);
    if (!answers.length) return null;

    return {
      id: String(question.id || `q${index + 1}`),
      text,
      options,
      answers,
      explanation: cleanText(question.explanation || question.reason || "")
    };
  }

  function normalizeOption(option, index) {
    if (typeof option === "string") {
      return { id: String(index), label: toLetter(index), text: cleanText(option) };
    }

    if (!option || typeof option !== "object") return null;

    const label = cleanText(option.label || option.tag || toLetter(index)).toUpperCase().slice(0, 3);
    const id = String(option.id ?? option.value ?? option.key ?? label ?? index);
    const text = cleanText(option.text || option.title || option.content || option.option || "");
    if (!text) return null;
    return { id, label: label || toLetter(index), text };
  }

  function normalizeAnswers(raw, options) {
    const optionById = new Map(options.map((option) => [String(option.id).toUpperCase(), option.id]));
    const optionByLabel = new Map(options.map((option) => [String(option.label).toUpperCase(), option.id]));
    const out = [];

    const add = (value) => {
      if (value === null || value === undefined || value === "") return;

      if (typeof value === "number" && options[value]) {
        out.push(options[value].id);
        return;
      }

      const rawValue = String(value).trim();
      if (!rawValue) return;

      const pieces = rawValue
        .replace(/^answer\s*:/i, "")
        .replace(/\band\b/gi, ",")
        .split(/[,&;/+|]+/)
        .map((piece) => piece.trim())
        .filter(Boolean);

      pieces.forEach((piece) => {
        const cleaned = piece.replace(/^[\(\[]|[\)\].:]+$/g, "").trim();
        const upper = cleaned.toUpperCase();
        const numeric = Number.parseInt(cleaned, 10);

        if (/^\d+$/.test(cleaned) && options[numeric]) out.push(options[numeric].id);
        else if (optionById.has(upper)) out.push(optionById.get(upper));
        else if (optionByLabel.has(upper)) out.push(optionByLabel.get(upper));
        else if (upper.length > 1 && optionByLabel.has(upper[0])) out.push(optionByLabel.get(upper[0]));
      });
    };

    if (Array.isArray(raw)) raw.forEach(add);
    else add(raw);

    return Array.from(new Set(out.map(String)));
  }

  function parsePlainText(text) {
    const source = extractSepBlock(text) || text;
    const lines = source.replace(/\r/g, "").split("\n");
    const questions = [];
    let current = null;
    let currentOption = null;
    let inExplanation = false;

    const pushOption = () => {
      if (!current || !currentOption) return;
      current.options.push(currentOption);
      currentOption = null;
    };

    const pushQuestion = () => {
      if (!current) return;
      pushOption();
      questions.push({
        text: current.text.trim(),
        options: current.options,
        answer: current.answerRaw.trim(),
        explanation: current.explanation.trim()
      });
      current = null;
      inExplanation = false;
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      const qMatch = line.match(/^(?:Q|Question)\s*\d+\s*[:.)-]\s*(.*)$/i);
      const answerMatch = line.match(/^Answer\s*:\s*(.+)$/i);
      const explanationMatch = line.match(/^Explanation\s*:\s*(.*)$/i);
      const optionMatch = line.match(/^\(?([A-Z])\)?\s*[\).:-]\s*(.+)$/);

      if (qMatch) {
        pushQuestion();
        current = { text: qMatch[1] || "", options: [], answerRaw: "", explanation: "" };
        inExplanation = false;
        return;
      }

      if (!current) return;

      if (answerMatch) {
        pushOption();
        current.answerRaw = current.answerRaw ? `${current.answerRaw}, ${answerMatch[1]}` : answerMatch[1];
        inExplanation = false;
        return;
      }

      if (explanationMatch) {
        pushOption();
        current.explanation = explanationMatch[1] || "";
        inExplanation = true;
        return;
      }

      if (optionMatch && !inExplanation) {
        pushOption();
        const label = optionMatch[1].toUpperCase();
        currentOption = { id: label, label, text: optionMatch[2] || "" };
        return;
      }

      if (!line) {
        if (currentOption) currentOption.text += "\n";
        else if (inExplanation) current.explanation += "\n";
        return;
      }

      if (currentOption) {
        currentOption.text += `${currentOption.text ? "\n" : ""}${rawLine.trimEnd()}`;
      } else if (inExplanation) {
        current.explanation += `${current.explanation ? " " : ""}${line}`;
      } else {
        current.text += `${current.text ? " " : ""}${line}`;
      }
    });

    pushQuestion();
    return questions;
  }

  function compactExam(exam) {
    const normalized = normalizeExam(exam);
    return {
      id: normalized.id,
      title: normalized.title,
      description: normalized.description,
      questions: normalized.questions.map(cleanQuestion)
    };
  }

  function cleanQuestion(question) {
    return {
      id: question.id,
      text: question.text,
      options: question.options.map((option, index) => ({
        id: String(option.id),
        label: option.label || option.display || toLetter(index),
        text: option.text
      })),
      answers: question.answers.map(String),
      explanation: question.explanation || ""
    };
  }

  function toPlainText(exam) {
    return exam.questions.map((question, index) => {
      const lines = [`Q${index + 1}: ${question.text}`];
      question.options.forEach((option, optionIndex) => {
        lines.push(`${option.label || toLetter(optionIndex)}) ${option.text}`);
      });
      lines.push(`Answer: ${answerLabels(question).join(" & ")}`);
      if (question.explanation) lines.push(`Explanation: ${question.explanation}`);
      return lines.join("\n");
    }).join("\n\n");
  }

  function answerLabels(question) {
    return question.answers.map((id) => labelForId(question, id)).filter(Boolean);
  }

  function labelForId(question, id) {
    const option = question.options.find((item) => String(item.id) === String(id));
    return option ? (option.display || option.label) : String(id);
  }

  function setEquals(a, b) {
    if (a.size !== b.size) return false;
    for (const value of a) {
      if (!b.has(value)) return false;
    }
    return true;
  }

  function toLetter(index) {
    return LETTERS[index] || String(index + 1);
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function sanitizeId(value) {
    const id = cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return id || `exam-${Date.now()}`;
  }

  function normalizeRelativePath(path) {
    return String(path || "").split("/").map(encodeURIComponent).join("/");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function looksLikeJson(text) {
    return /^\s*[\[{]/.test(text || "");
  }

  function extractSepBlock(text) {
    const start = text.indexOf("###SEP-EXAM-BEGIN###");
    const end = text.indexOf("###SEP-EXAM-END###");
    if (start >= 0 && end > start) {
      return text.slice(start + "###SEP-EXAM-BEGIN###".length, end).trim();
    }
    return "";
  }

  function stripHtml(html) {
    const container = document.createElement("div");
    container.innerHTML = html;
    return (container.textContent || "").replace(/\u00a0/g, " ");
  }

  function makeButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function makePill(label) {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = label;
    return pill;
  }

  function downloadJson(name, data) {
    downloadText(name, JSON.stringify(data, null, 2), "application/json");
  }

  function downloadText(name, content, type = "text/plain") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    return `"${String(value).replace(/"/g, '""')}"`;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Link copied.");
    } catch {
      window.prompt("Copy this link:", text);
    }
  }

  function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return hours ? `${String(hours).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    if (state.toastId) window.clearTimeout(state.toastId);
    state.toastId = window.setTimeout(() => {
      els.toast.classList.remove("is-visible");
    }, 3200);
  }

  function debounce(fn, wait) {
    let id = null;
    return (...args) => {
      if (id) window.clearTimeout(id);
      id = window.setTimeout(() => fn(...args), wait);
    };
  }

  function handleKeyboard(event) {
    if (els.examView.classList.contains("hidden")) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;

    const current = nearestQuestionIndex();
    if (event.key.toLowerCase() === "j") {
      focusQuestion(Math.min(state.questions.length - 1, current + 1));
    } else if (event.key.toLowerCase() === "k") {
      focusQuestion(Math.max(0, current - 1));
    } else if (event.key.toLowerCase() === "f" && current >= 0) {
      if (state.flags.has(current)) state.flags.delete(current);
      else state.flags.add(current);
      syncQuestionNav();
      scheduleAttemptSave();
    } else if (/^[1-9]$/.test(event.key) && current >= 0 && !state.submittedAt) {
      const optionIndex = Number.parseInt(event.key, 10) - 1;
      const card = els.examForm.querySelector(`[data-index="${current}"]`);
      const input = card && card.querySelectorAll(".option-row input")[optionIndex];
      if (input) {
        input.checked = input.type === "radio" ? true : !input.checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  function nearestQuestionIndex() {
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    els.examForm.querySelectorAll(".question-card").forEach((card) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.top - 90);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = Number(card.dataset.index);
      }
    });
    return bestIndex;
  }

  function focusQuestion(index) {
    const card = els.examForm.querySelector(`[data-index="${index}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
})();
