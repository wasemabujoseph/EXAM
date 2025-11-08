# Smart Exam Pro — GitHub Pages + Saved Exams

This version lets users either:
1) **Start One-Time** – load an exam from `/exams` or pasted MCQs without saving the exam itself.
2) **Save Locally & Start** – store the exam in the browser (localStorage) so it’s available even after closing/reopening the page.

> Saved exams live on the same origin (this GitHub Pages site) in the user’s browser storage. They are *device-specific*.  
> Deep links like `?saved=<id>` work on the **same device**. To move saved exams to another device, use **Export/Import**.

## Quick Start
1. Push this folder to your repo `wasemabujoseph/EXAM`.
2. In GitHub → **Settings → Pages**: enable Pages for the `main` branch, `/root`.
3. Visit: `https://wasemabujoseph.github.io/EXAM/`

## Use
- **Load From Repo** tab:
  - Pick an exam listed in `/exams/index.json`.
  - Click **Start One-Time** or **Save Locally & Start**.
  - **Copy Link** gives `?exam=<id>` (remote deep link).
- **My Saved Exams** tab:
  - Lists saved exams (from this device).
  - **Start**, **Copy Link** (`?saved=<id>`), **Export**, **Delete**.
  - Top-right: **Export All**, **Import**, **Delete All**.
- **Paste MCQs** tab:
  - Paste plain text MCQs (Q/A format).
  - Provide optional Title and ID.
  - **Start One-Time** or **Save Locally & Start**.

## JSON Exam Schema
```json
{
  "title": "Your Exam",
  "description": "Shown under the title",
  "questions": [
    {
      "text": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 1,
      "explanation": "Why it's correct"
    }
  ]
}
