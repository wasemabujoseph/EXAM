# EXAM Backend Setup (Google Apps Script)

This folder contains the backend logic for the EXAM project. It uses Google Apps Script to interface with a Google Sheet as a database.

## Setup Instructions

1.  **Create a Google Sheet**:
    *   Open the sheet: [https://docs.google.com/spreadsheets/d/1wjo94ElGv7T-Hq5AoLQ7wleMYnu5c51ia7mbZX8FhEc/edit](https://docs.google.com/spreadsheets/d/1wjo94ElGv7T-Hq5AoLQ7wleMYnu5c51ia7mbZX8FhEc/edit)
    *   Ensure you have edit access.

2.  **Open Apps Script Editor**:
    *   In the Google Sheet, go to **Extensions** > **Apps Script**.

3.  **Copy the Code**:
    *   Delete any existing code in `Code.gs`.
    *   Copy the content of `Code.gs` from this folder and paste it into the editor.

4.  **Deploy as Web App**:
    *   Click **Deploy** > **New deployment**.
    *   Select type: **Web app**.
    *   Description: `EXAM API V1`.
    *   Execute as: **Me**.
    *   Who has access: **Anyone** (This is required for the frontend to call the API without a Google Login popup).
    *   Click **Deploy**.
    *   Authorize the script when prompted.

5.  **Get the Web App URL**:
    *   Copy the **Web App URL** (it should look like `https://script.google.com/macros/s/.../exec`).

6.  **Configure Frontend**:
    *   In your local `EXAM` folder, create a `.env` file (or update it).
    *   Add the URL:
        ```env
        VITE_APPS_SCRIPT_API_URL=your_web_app_url_here
        ```

## Database Structure

The script will automatically create the following tabs in your Google Sheet if they don't exist:

-   **Users**: Stores user credentials (hashed passwords and salts).
-   **Sessions**: Stores active login sessions (hashed tokens).
-   **Exams**: Stores generated exams.
-   **ExamAttempts**: Stores student results and answers.
-   **PasswordResets**: (Reserved for future use).
-   **AuditLog**: Logs important actions.

## Security Notes

-   **Passwords**: Stored as SHA-256 hashes with a unique salt per user.
-   **Sessions**: Session tokens are hashed before storage. Only the raw token is sent to the client.
-   **Access Control**: Protected actions (like saving an exam or viewing private results) require a valid session token.
