# MD Curriculum Exam Hub

A professional medical curriculum dashboard and encrypted exam resource hub. Browse subjects, credits, and academic materials organized by year and semester, and generate your own private exams.

## Features
- **Full MD Curriculum**: Complete Grade 1-6 curriculum structure.
- **Interactive Dashboard**: Navigate by Year and Semester.
- **Exam Generator**: Paste MCQ text to create your own private exams.
- **Encrypted Local Storage**: All user data (profile, exams, results, history) is encrypted locally using **AES-GCM**.
- **Results History**: Detailed review of past attempts with score, time, and question-by-question analysis.
- **Local Leaderboard**: Track your personal best scores.
- **Secure Static Hosting**: Designed for GitHub Pages. No backend required.

## Security Model
This application uses a **Zero-Knowledge** local encryption model:
1. **No Backend**: Data is never uploaded to a central server.
2. **Client-Side Encryption**: Your password is used to derive a 256-bit AES key via **PBKDF2**.
3. **Encrypted Vault**: All private data is stored in your browser's `localStorage` as an encrypted blob.
4. **No Password Recovery**: Since we don't store your password or data, we cannot recover it. If you forget your password, you must reset your local vault.

## MCQ Parser
The "Generate Exam" tool supports flexible formats:
- Supports `Q1:`, `Question 1:`, or simple numbered questions.
- Detects options like `A)`, `B)`, `1.`, `(A)`.
- Detects answers like `Answer: A`, `Correct: B`, `Ans: C`.
- Allows editing and previewing before saving.

## Backup & Portability
- **Export Backup**: Download your entire encrypted vault as a JSON file.
- **Import Backup**: Restore your vault on another device or browser.
- **Manual GitHub Backup**: You can manually upload your exported encrypted JSON to a private GitHub repository for safekeeping.

## Development
- **Run Locally**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Deployment

### GitHub Pages
The project is automatically deployed to GitHub Pages via GitHub Actions:
[https://wasemabujoseph.github.io/EXAM/](https://wasemabujoseph.github.io/EXAM/)

### Cloudflare Pages
The project is also optimized for Cloudflare Pages:
[https://exam-cyx.pages.dev/](https://exam-cyx.pages.dev/)

**Required Cloudflare Pages Settings:**
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`
- **Node.js version**: `20` (specified via `.nvmrc`)

*Deployment steps:*
1. Connect your GitHub repository to Cloudflare Pages.
2. In the **Build configuration**, set the output directory to `dist`.
3. In **Settings > Builds & deployments**, ensure the Node.js version is set to 20.
4. If the site shows a white page, verify the **Build output directory** is set to `dist` and NOT the project root.

---
*Note: This app is hosted on static providers. Private user data is encrypted and stored locally in the user's browser. Never put GitHub tokens or encryption keys into frontend code.*
