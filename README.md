# EXAM

EXAM is a production-ready static exam workspace for creating, running, saving, reviewing, and exporting multiple-choice exams directly in the browser.

Live site:

https://wasemabujoseph.github.io/EXAM/

## What It Does

- Load curated exams from `exams/index.json`.
- Paste MCQs in a simple `Q1 / A) / Answer:` format.
- Import `.json`, `.txt`, `.md`, `.sep`, and `.docx` files.
- Save reusable exams locally in the browser.
- Run timed or untimed attempts with shuffled questions and choices.
- Support single-answer and multi-answer questions.
- Review answers, retry wrong questions, print results, and export reports.

## Local Development

```bash
npm install
npm run build
npm run serve
```

The local server prints a URL, usually `http://localhost:4173/`.

## Build

```bash
npm run build
```

The build validates the static files and exam JSON, then writes the deployable site to `dist/`.

## Deployment

GitHub Pages deployment is handled by `.github/workflows/deploy.yml`.

The workflow:

1. Installs with `npm ci`.
2. Runs `npm run build`.
3. Uploads `dist/` to GitHub Pages.

Expected production URL:

https://wasemabujoseph.github.io/EXAM/

## Repository Exam Manifest

`exams/index.json` lists exams that can be loaded by the app:

```json
{
  "exams": [
    {
      "id": "sample",
      "title": "Sample MCQ Exam",
      "file": "sample.json",
      "description": "A short demo exam hosted from this repo."
    }
  ]
}
```

## Exam JSON Schema

```json
{
  "id": "sample",
  "title": "Sample MCQ Exam",
  "description": "Optional description",
  "questions": [
    {
      "text": "What does HTML stand for?",
      "options": [
        "Hyperlinks and Text Markup Language",
        "Hyper Text Markup Language",
        "Home Tool Markup Language",
        "Hyperlinking Textual Management Language"
      ],
      "answer": 1,
      "explanation": "HTML stands for Hyper Text Markup Language."
    }
  ]
}
```

`answer` can be a zero-based number, a letter, or an array for multiple correct answers.
