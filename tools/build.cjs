const fs = require("fs");
const path = require("path");

const root = process.cwd();
const dist = path.join(root, "dist");
const requiredFiles = ["index.html", "style.css", "script.js", "README.md", "package.json", ".nojekyll"];
const copiedFiles = ["index.html", "style.css", "script.js", ".nojekyll"];
const mojibakePattern = /[�]|(?:Ã|Â|â|ð)/;

function fail(message) {
  console.error(`Build failed: ${message}`);
  process.exit(1);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function assertFile(file) {
  if (!fs.existsSync(path.join(root, file))) fail(`Missing ${file}`);
}

function copyFile(file) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
}

function validatePrimaryFiles() {
  requiredFiles.forEach(assertFile);

  const index = read("index.html");
  if (!index.includes('href="style.css"')) fail("index.html does not reference style.css");
  if (!index.includes('src="script.js"')) fail("index.html does not reference script.js");

  ["index.html", "style.css", "script.js", "README.md"].forEach((file) => {
    if (mojibakePattern.test(read(file))) fail(`${file} contains mojibake or replacement characters`);
  });
}

function validateExamManifest() {
  const manifestPath = path.join(root, "exams", "index.json");
  if (!fs.existsSync(manifestPath)) fail("Missing exams/index.json");

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(`exams/index.json is invalid JSON: ${error.message}`);
  }

  if (!Array.isArray(manifest.exams)) fail("exams/index.json must contain an exams array");

  manifest.exams.forEach((entry, index) => {
    if (!entry.id || !entry.file || !entry.title) fail(`Manifest entry ${index + 1} is missing id, title, or file`);

    const examPath = path.join(root, "exams", entry.file);
    if (!fs.existsSync(examPath)) fail(`Manifest entry ${entry.id} points to missing file ${entry.file}`);

    let exam;
    try {
      exam = JSON.parse(fs.readFileSync(examPath, "utf8"));
    } catch (error) {
      fail(`${entry.file} is invalid JSON: ${error.message}`);
    }

    validateExamFile(exam, entry.file);
  });
}

function validateExamFile(exam, file) {
  if (!exam || !Array.isArray(exam.questions) || !exam.questions.length) {
    fail(`${file} must contain a non-empty questions array`);
  }

  exam.questions.forEach((question, index) => {
    const label = `${file} question ${index + 1}`;
    if (!question.text && !question.question && !question.stem) fail(`${label} is missing text`);
    if (!Array.isArray(question.options) || question.options.length < 2) fail(`${label} must have at least two options`);

    const answer = question.answers ?? question.answer ?? question.correctAnswers ?? question.correct ?? question.correctIndex;
    if (answer === undefined || answer === null || answer === "") fail(`${label} is missing an answer`);
  });
}

function copyStaticFiles() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });
  copiedFiles.forEach(copyFile);
  fs.cpSync(path.join(root, "exams"), path.join(dist, "exams"), { recursive: true });
}

validatePrimaryFiles();
validateExamManifest();
copyStaticFiles();

console.log("Build complete: dist/");
