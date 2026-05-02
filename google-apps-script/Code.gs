/**
 * EXAM Backend - Google Apps Script
 * This script acts as the backend for the EXAM project, using Google Sheets as a database.
 */

const SPREADSHEET_ID = '1wjo94ElGv7T-Hq5AoLQ7wleMYnu5c51ia7mbZX8FhEc';

const TABLES = {
  USERS: 'Users',
  SESSIONS: 'Sessions',
  EXAMS: 'Exams',
  EXAM_ATTEMPTS: 'ExamAttempts',
  PASSWORD_RESETS: 'PasswordResets',
  AUDIT_LOG: 'AuditLog'
};

const HEADERS = {
  [TABLES.USERS]: ['id', 'username', 'email', 'password_hash', 'salt', 'role', 'created_at'],
  [TABLES.SESSIONS]: ['id', 'user_id', 'token_hash', 'expires_at', 'created_at'],
  [TABLES.EXAMS]: ['id', 'user_id', 'title', 'description', 'grade', 'subject', 'exam_data_json', 'is_public', 'created_at'],
  [TABLES.EXAM_ATTEMPTS]: ['id', 'user_id', 'exam_id', 'score', 'total_questions', 'answers_json', 'duration_seconds', 'created_at'],
  [TABLES.PASSWORD_RESETS]: ['id', 'user_id', 'token_hash', 'expires_at', 'created_at'],
  [TABLES.AUDIT_LOG]: ['id', 'user_id', 'action', 'details', 'ip_address', 'created_at']
};

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No data received in request body. Ensure you are sending a POST request with a body.');
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.payload || {};
    const token = data.token;

    // Initialize sheets if needed
    initSheets();

    let user = null;
    if (token) {
      user = getUserByToken(token);
    }

    let result;
    switch (action) {
      case 'health':
        result = { 
          status: 'ok', 
          version: 'apps-script-v2.1', 
          sheetConnected: !!SpreadsheetApp.openById(SPREADSHEET_ID) 
        };
        break;
      case 'register':
        result = handleRegister(payload);
        break;
      case 'login':
        result = handleLogin(payload);
        break;
      case 'logout':
        result = handleLogout(token);
        break;
      case 'getMe':
        result = handleGetMe(user);
        break;
      case 'saveExam':
        result = handleSaveExam(user, payload);
        break;
      case 'getMyExams':
        result = handleGetMyExams(user);
        break;
      case 'getPublicExams':
        result = handleGetPublicExams();
        break;
      case 'getExamById':
        result = handleGetExamById(payload.id);
        break;
      case 'deleteExam':
        result = handleDeleteExam(user, payload.id);
        break;
      case 'saveAttempt':
        result = handleSaveAttempt(user, payload);
        break;
      case 'getMyAttempts':
        result = handleGetMyAttempts(user);
        break;
      case 'getAttemptReview':
        result = handleGetAttemptReview(user, payload.id);
        break;
      case 'getLeaderboard':
        result = handleGetLeaderboard(payload.examId);
        break;
      default:
        throw new Error('Unknown action: ' + action);
    }

    // Success response
    return createResponse({ 
      ok: true, 
      data: result 
    });
  } catch (error) {
    const errorMsg = error.message || String(error);
    console.error('API Error:', errorMsg);
    // Error response
    return createResponse({ 
      ok: false, 
      error: errorMsg 
    });
  }
}

/**
 * Handle GET requests (for simple checks)
 */
function doGet(e) {
  return createResponse({ status: 'ok', message: 'EXAM Apps Script API is running' });
}

// --- Handlers ---

function handleRegister(payload) {
  const { username, password, email } = payload;
  if (!username) throw new Error('Username is required');
  if (!email) throw new Error('Email is required');
  if (!password) throw new Error('Password is required');

  const sheet = getSheet(TABLES.USERS);
  const data = sheet.getDataRange().getValues();

  // Check if user exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toLowerCase() === username.toLowerCase()) throw new Error('Username already taken');
    if (data[i][2].toLowerCase() === email.toLowerCase()) throw new Error('Email already registered');
  }

  const salt = generateUUID();
  const passwordHash = hashPassword(password, salt);
  const userId = generateUUID();
  const isFirstUser = data.length === 1; // Only headers
  const role = isFirstUser ? 'admin' : 'user';

  const newUser = [
    userId,
    username,
    email,
    passwordHash,
    salt,
    role,
    new Date().toISOString()
  ];

  sheet.appendRow(newUser);
  logAction(userId, 'REGISTER', `User ${username} registered`);

  return handleLogin({ username, password });
}

function handleLogin(payload) {
  const { username, password } = payload;
  if (!username) throw new Error('Username is required');
  if (!password) throw new Error('Password is required');

  const sheet = getSheet(TABLES.USERS);
  const data = sheet.getDataRange().getValues();

  let user = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toLowerCase() === username.toLowerCase()) {
      user = {
        id: data[i][0],
        username: data[i][1],
        passwordHash: data[i][3],
        salt: data[i][4],
        role: data[i][5]
      };
      break;
    }
  }

  if (!user || hashPassword(password, user.salt) !== user.passwordHash) {
    throw new Error('Invalid username or password');
  }

  const token = generateUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const sessionsSheet = getSheet(TABLES.SESSIONS);
  sessionsSheet.appendRow([
    generateUUID(),
    user.id,
    tokenHash,
    expiresAt,
    new Date().toISOString()
  ]);

  logAction(user.id, 'LOGIN', `User ${username} logged in`);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
}

function handleLogout(token) {
  if (!token) return { success: true };
  const tokenHash = hashToken(token);
  const sheet = getSheet(TABLES.SESSIONS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === tokenHash) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return { success: true };
}

function handleGetMe(user) {
  if (!user) throw new Error('Unauthorized');
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };
}

function handleSaveExam(user, payload) {
  if (!user) throw new Error('Unauthorized');
  const { title, description, grade, subject, examData, isPublic } = payload;
  const sheet = getSheet(TABLES.EXAMS);
  const id = generateUUID();

  sheet.appendRow([
    id,
    user.id,
    title,
    description,
    grade,
    subject,
    JSON.stringify(examData),
    isPublic ? 'TRUE' : 'FALSE',
    new Date().toISOString()
  ]);

  logAction(user.id, 'SAVE_EXAM', `Exam ${title} saved`);
  return { id };
}

function handleGetMyExams(user) {
  if (!user) throw new Error('Unauthorized');
  const sheet = getSheet(TABLES.EXAMS);
  const data = sheet.getDataRange().getValues();
  const exams = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === user.id) {
      exams.push({
        id: data[i][0],
        title: data[i][2],
        description: data[i][3],
        grade: data[i][4],
        subject: data[i][5],
        isPublic: data[i][7] === 'TRUE',
        createdAt: data[i][8]
      });
    }
  }
  return exams;
}

function handleGetPublicExams() {
  const sheet = getSheet(TABLES.EXAMS);
  const data = sheet.getDataRange().getValues();
  const exams = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === 'TRUE') {
      exams.push({
        id: data[i][0],
        title: data[i][2],
        description: data[i][3],
        grade: data[i][4],
        subject: data[i][5],
        createdAt: data[i][8]
      });
    }
  }
  return exams;
}

function handleGetExamById(id) {
  const sheet = getSheet(TABLES.EXAMS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return {
        id: data[i][0],
        title: data[i][2],
        description: data[i][3],
        grade: data[i][4],
        subject: data[i][5],
        examData: JSON.parse(data[i][6]),
        isPublic: data[i][7] === 'TRUE',
        createdAt: data[i][8]
      };
    }
  }
  throw new Error('Exam not found');
}

function handleDeleteExam(user, id) {
  if (!user) throw new Error('Unauthorized');
  const sheet = getSheet(TABLES.EXAMS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (data[i][1] !== user.id && user.role !== 'admin') {
        throw new Error('Forbidden');
      }
      sheet.deleteRow(i + 1);
      logAction(user.id, 'DELETE_EXAM', `Exam ${id} deleted`);
      return { success: true };
    }
  }
  throw new Error('Exam not found');
}

function handleSaveAttempt(user, payload) {
  if (!user) throw new Error('Unauthorized');
  const { examId, score, totalQuestions, answers, durationSeconds } = payload;
  const sheet = getSheet(TABLES.EXAM_ATTEMPTS);
  const id = generateUUID();

  sheet.appendRow([
    id,
    user.id,
    examId,
    score,
    totalQuestions,
    JSON.stringify(answers),
    durationSeconds,
    new Date().toISOString()
  ]);

  logAction(user.id, 'SAVE_ATTEMPT', `Attempt for exam ${examId} saved`);
  return { id };
}

function handleGetMyAttempts(user) {
  if (!user) throw new Error('Unauthorized');
  const attemptsSheet = getSheet(TABLES.EXAM_ATTEMPTS);
  const attemptsData = attemptsSheet.getDataRange().getValues();
  const examsSheet = getSheet(TABLES.EXAMS);
  const examsData = examsSheet.getDataRange().getValues();

  const examMap = {};
  for (let i = 1; i < examsData.length; i++) {
    examMap[examsData[i][0]] = examsData[i][2]; // id -> title
  }

  const attempts = [];
  for (let i = 1; i < attemptsData.length; i++) {
    if (attemptsData[i][1] === user.id) {
      attempts.push({
        id: attemptsData[i][0],
        examId: attemptsData[i][2],
        examTitle: examMap[attemptsData[i][2]] || 'Unknown Exam',
        score: attemptsData[i][3],
        totalQuestions: attemptsData[i][4],
        createdAt: attemptsData[i][7]
      });
    }
  }
  return attempts;
}

function handleGetAttemptReview(user, attemptId) {
  if (!user) throw new Error('Unauthorized');
  const sheet = getSheet(TABLES.EXAM_ATTEMPTS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === attemptId) {
      if (data[i][1] !== user.id && user.role !== 'admin') {
        throw new Error('Forbidden');
      }
      
      const exam = handleGetExamById(data[i][2]);
      
      return {
        id: data[i][0],
        examId: data[i][2],
        examTitle: exam.title,
        score: data[i][3],
        totalQuestions: data[i][4],
        answers: JSON.parse(data[i][5]),
        durationSeconds: data[i][6],
        createdAt: data[i][7],
        questions: exam.examData.questions
      };
    }
  }
  throw new Error('Attempt not found');
}

function handleGetLeaderboard(examId) {
  const attemptsSheet = getSheet(TABLES.EXAM_ATTEMPTS);
  const attemptsData = attemptsSheet.getDataRange().getValues();
  const usersSheet = getSheet(TABLES.USERS);
  const usersData = usersSheet.getDataRange().getValues();

  const userMap = {};
  for (let i = 1; i < usersData.length; i++) {
    userMap[usersData[i][0]] = usersData[i][1]; // id -> username
  }

  const scores = [];
  for (let i = 1; i < attemptsData.length; i++) {
    if (!examId || attemptsData[i][2] === examId) {
      scores.push({
        username: userMap[attemptsData[i][1]] || 'Anonymous',
        score: attemptsData[i][3],
        totalQuestions: attemptsData[i][4],
        createdAt: attemptsData[i][7]
      });
    }
  }

  // Sort by score (desc) and time
  return scores.sort((a, b) => b.score - a.score).slice(0, 50);
}

// --- Utilities ---

function getUserByToken(token) {
  const tokenHash = hashToken(token);
  const sessionsSheet = getSheet(TABLES.SESSIONS);
  const sessionsData = sessionsSheet.getDataRange().getValues();

  let userId = null;
  let expiresAt = null;

  for (let i = 1; i < sessionsData.length; i++) {
    if (sessionsData[i][2] === tokenHash) {
      userId = sessionsData[i][1];
      expiresAt = new Date(sessionsData[i][3]);
      break;
    }
  }

  if (!userId || expiresAt < new Date()) return null;

  const usersSheet = getSheet(TABLES.USERS);
  const usersData = usersSheet.getDataRange().getValues();

  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][0] === userId) {
      return {
        id: usersData[i][0],
        username: usersData[i][1],
        email: usersData[i][2],
        role: usersData[i][5]
      };
    }
  }
  return null;
}

function hashPassword(password, salt) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  return digest.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

function hashToken(token) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token);
  return digest.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

function generateUUID() {
  return Utilities.getUuid();
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS[name]);
  }
  return sheet;
}

function initSheets() {
  Object.values(TABLES).forEach(tableName => {
    getSheet(tableName);
  });
}

function logAction(userId, action, details) {
  try {
    const sheet = getSheet(TABLES.AUDIT_LOG);
    sheet.appendRow([
      generateUUID(),
      userId || 'SYSTEM',
      action,
      details,
      '', // IP would be nice but GAS doPost doesn't easily provide it
      new Date().toISOString()
    ]);
  } catch (e) {
    console.error('Logging failed', e);
  }
}

function createResponse(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
