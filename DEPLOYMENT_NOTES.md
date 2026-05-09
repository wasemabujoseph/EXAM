# Deployment Notes - MEDEXAM Materials System

## Backend Setup (Google Apps Script)
1. Copy the updated `google-apps-script/Code.gs` into your Google Apps Script project.
2. In the Apps Script Editor, go to **Project Settings** > **Script Properties**.
3. Add a new property:
   - **Key**: `MATERIALS_ROOT_FOLDER_ID`
   - **Value**: `1vD3C01--NsojcDgc6kzlIkXK4nunx1yg` (or your preferred root folder ID)
4. Redeploy the script as a **Web App** (New Version) and ensure access is set to "Anyone".
5. (Optional) Run the `SETUP_OPENROUTER_KEY` function once if you haven't configured AI insights.

## Frontend Setup (Cloudflare Pages / Vercel)
1. Ensure the following environment variables are set in your deployment platform:
   - `VITE_APPS_SCRIPT_API_URL`: The URL of your deployed Apps Script Web App.
   - `OPENROUTER_API_KEY`: (Secret) Your OpenRouter API key.
2. Push the changes to your GitHub repository.
3. The build should trigger automatically and deploy the new features.

## Testing Checklist
### Admin
- [ ] Navigate to **Admin Panel** > **Materials Library**.
- [ ] Upload a PDF, Image, and Exam JSON.
- [ ] Verify files are created in Google Drive under `Year / Subject / Type`.
- [ ] Toggle student visibility and verify it reflects in the student view.
- [ ] Delete a material and verify it is trashed in Google Drive.

### Student
- [ ] Navigate to **Learning Materials** in the sidebar.
- [ ] Filter by Year and Subject.
- [ ] View a PDF or Image.
- [ ] Click "Start Exam" on an Exam JSON material and verify it loads in `ExamRunner`.
- [ ] Go to a **Subject Details** page and verify the "Cloud Resources" section shows relevant materials.
