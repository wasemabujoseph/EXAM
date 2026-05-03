/**
 * MEDEXAM Core Backend (Version 3.2.0 - Master)
 * This script acts as the secure cloud gateway for the MEDEXAM platform.
 */

const SPREADSHEET_ID = '1wjo94ElGv7T-Hq5AoLQ7wleMYnu5c51ia7mbZX8FhEc';

/**
 * Emails in this list are automatically promoted to Admin/Pro status
 */
const SUPER_ADMIN_EMAILS = [
  'wasemkhallaf864@gmail.com',
  'wasemkhallaf86@gmail.com'
];

const TABLES = {
  USERS: 'Users',
  SESSIONS: 'Sessions',
  EXAMS: 'Exams',
  EXAM_ATTEMPTS: 'ExamAttempts',
  AUDIT_LOG: 'AuditLog'
};

const HEADERS = {
  [TABLES.USERS]: ['id', 'username', 'email', 'password_hash', 'salt', 'role', 'status', 'plan', 'trial_limit', 'attempt_count', 'created_at', 'updated_at', 'last_login'],
  [TABLES.SESSIONS]: ['id', 'user_id', 'token_hash', 'expires_at', 'created_at'],
  [TABLES.EXAMS]: ['id', 'user_id', 'title', 'description', 'grade', 'subject', 'tags_json', 'difficulty', 'time_limit_minutes', 'exam_data_json', 'is_public', 'status', 'featured', 'created_at', 'updated_at'],
  [TABLES.EXAM_ATTEMPTS]: ['id', 'user_id', 'exam_id', 'score', 'total_questions', 'percentage', 'answers_json', 'questions_snapshot_json', 'duration_seconds', 'mode', 'created_at'],
  [TABLES.AUDIT_LOG]: ['id', 'user_id', 'action', 'details', 'ip_address', 'created_at']
};

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No data received in request body.');
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.payload || {};
    const token = data.token;

    let user = null;
    if (token) {
      user = getUserByToken(token);
    }

    let result;
    switch (action) {
      case 'health':
        result = { status: 'ok', version: '3.2.0', db: TABLES.USERS };
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
      
      // Admin Actions
      case 'adminGetStats':
        result = handleAdminGetStats(user);
        break;
      case 'adminGetUsers':
        result = handleAdminGetUsers(user);
        break;
      case 'adminUpdateUser':
        result = handleAdminUpdateUser(user, payload);
        break;
      case 'adminGetAllExams':
        result = handleAdminGetAllExams(user);
        break;
      case 'adminGetAllAttempts':
        result = handleAdminGetAllAttempts(user);
        break;
      
      // AI Actions
      case 'aiChat':
        result = handleAIChat(user, payload);
        break;
      case 'aiExplain':
        result = handleAIExplain(user, payload);
        break;

      default:
        throw new Error('Unknown action: ' + action);
    }

    return createResponse({ ok: true, data: result });
  } catch (error) {
    return createResponse({ ok: false, error: error.message || String(error) });
  }
}

function doGet(e) {
  const ss = getSs();
  const userSheet = ss.getSheetByName(TABLES.USERS);
  const users = userSheet ? userSheet.getDataRange().getValues().slice(1).map(r => r[1]) : [];
  
  const info = {
    status: 'ok',
    version: '3.2.0',
    spreadsheetName: ss.getName(),
    sheets: ss.getSheets().map(s => s.getName()),
    registeredUsernames: users.map(u => u ? (u.length > 2 ? u.substring(0, 2) + '***' : '***') : 'null')
  };
  return createResponse(info);
}

// --- Auth Handlers ---

function handleRegister(payload) {
  const { username, password, email } = payload;
  const sheet = getSheet(TABLES.USERS);
  const data = sheet.getDataRange().getValues();

  const newUsername = (username || '').toString().toLowerCase().trim();
  const newEmail = (email || '').toString().toLowerCase().trim();

  if (!newUsername || !newEmail) throw new Error('Username and Email are required');

  for (let i = 1; i < data.length; i++) {
    const rowUsername = (data[i][1] || '').toString().toLowerCase().trim();
    const rowEmail = (data[i][2] || '').toString().toLowerCase().trim();
    if (rowUsername === newUsername) throw new Error('Username taken');
    if (rowEmail === newEmail) throw new Error('Email taken');
  }

  const salt = generateUUID();
  const passwordHash = hashPassword(password, salt);
  const id = generateUUID();
  const role = data.length === 1 ? 'admin' : 'user';
  const now = new Date().toISOString();

  const newUser = [id, newUsername, newEmail, passwordHash, salt, role, 'active', 'free', 4, 0, now, now, ''];
  sheet.appendRow(newUser);
  logAction(id, 'REGISTER', `New user: ${newUsername}`);
  
  return handleLogin({ username: newUsername, password });
}

function handleLogin(payload) {
  const { username, password } = payload;
  const sheet = getSheet(TABLES.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const searchVal = (username || '').toString().toLowerCase().trim();
  if (!searchVal) throw new Error('Username or email is required');

  let userIdx = -1;
  for (let i = 1; i < data.length; i++) {
    const rowUsername = (data[i][1] || '').toString().toLowerCase().trim();
    const rowEmail = (data[i][2] || '').toString().toLowerCase().trim();
    if (rowUsername === searchVal || rowEmail === searchVal) {
      userIdx = i;
      break;
    }
  }

  if (userIdx === -1) throw new Error('Invalid credentials');
  const user = rowToObject(data[userIdx], headers);

  if (user.status === 'blocked') throw new Error('Account is blocked.');
  if (hashPassword(password, user.salt) !== user.password_hash) throw new Error('Invalid credentials');

  const token = generateUUID();
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  getSheet(TABLES.SESSIONS).appendRow([generateUUID(), user.id, tokenHash, expiresAt, now.toISOString()]);
  
  const lastLoginCol = headers.indexOf('last_login') + 1;
  if (lastLoginCol > 0) sheet.getRange(userIdx + 1, lastLoginCol).setValue(now.toISOString());

  const isSuperAdmin = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === (user.email || '').toLowerCase().trim());
  if (isSuperAdmin && (user.role !== 'admin' || user.plan !== 'pro')) {
    sheet.getRange(userIdx + 1, 6).setValue('admin');
    sheet.getRange(userIdx + 1, 8).setValue('pro');
    user.role = 'admin';
    user.plan = 'pro';
  }

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status, plan: user.plan }
  };
}

function handleGetMe(user) {
  if (!user) throw new Error('Not authenticated');
  const dbUser = getUserById(user.id);
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    role: dbUser.role,
    status: dbUser.status,
    plan: dbUser.plan,
    trial_limit: dbUser.trial_limit,
    attempt_count: dbUser.attempt_count
  };
}

function handleLogout(token) {
  if (!token) return { ok: true };
  const hash = hashToken(token);
  const sheet = getSheet(TABLES.SESSIONS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === hash) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return { ok: true };
}

// --- Exam Handlers ---

function handleSaveExam(user, payload) {
  if (!user) throw new Error('Unauthorized');
  const { title, description, grade, subject, examData, isPublic, tags, difficulty, timeLimit, status } = payload;
  const sheet = getSheet(TABLES.EXAMS);
  const id = generateUUID();
  const now = new Date().toISOString();

  sheet.appendRow([
    id, user.id, title, description, grade, subject, 
    JSON.stringify(tags || []), difficulty || 'medium', timeLimit || 0,
    JSON.stringify(examData), isPublic ? 'TRUE' : 'FALSE', 
    status || 'published', 'FALSE', now, now
  ]);

  return { id };
}

function handleGetMyExams(user) {
  if (!user) throw new Error('Unauthorized');
  const data = getSheet(TABLES.EXAMS).getDataRange().getValues();
  const headers = data[0];
  const exams = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === user.id) exams.push(rowToObject(data[i], headers));
  }
  return exams;
}

function handleGetPublicExams() {
  const data = getSheet(TABLES.EXAMS).getDataRange().getValues();
  const headers = data[0];
  const exams = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][10] === 'TRUE' || data[i][11] === 'published') exams.push(rowToObject(data[i], headers));
  }
  return exams;
}

function handleGetExamById(id) {
  const data = getSheet(TABLES.EXAMS).getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const obj = rowToObject(data[i], headers);
      obj.examData = JSON.parse(obj.exam_data_json);
      return obj;
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
      if (data[i][1] !== user.id && user.role !== 'admin') throw new Error('Forbidden');
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error('Not found');
}

// --- Attempt Handlers ---

function handleSaveAttempt(user, payload) {
  if (!user) throw new Error('Unauthorized');
  const dbUser = getUserById(user.id);
  if (dbUser.status === 'blocked') throw new Error('Account blocked');

  const { examId, score, totalQuestions, answers, durationSeconds, questionsSnapshot, mode } = payload;
  const percentage = Math.round((score / totalQuestions) * 100);
  const id = generateUUID();
  const now = new Date().toISOString();

  getSheet(TABLES.EXAM_ATTEMPTS).appendRow([
    id, user.id, examId, score, totalQuestions, percentage,
    JSON.stringify(answers), JSON.stringify(questionsSnapshot || []),
    durationSeconds, mode || 'normal', now
  ]);

  const userSheet = getSheet(TABLES.USERS);
  const userData = userSheet.getDataRange().getValues();
  const headers = userData[0];
  const countCol = headers.indexOf('attempt_count') + 1;
  const updateCol = headers.indexOf('updated_at') + 1;
  
  for(let i=1; i<userData.length; i++) {
    if(userData[i][0] === user.id) {
      const currentCount = parseInt(userData[i][countCol-1]) || 0;
      userSheet.getRange(i+1, countCol).setValue(currentCount + 1);
      userSheet.getRange(i+1, updateCol).setValue(now);
      break;
    }
  }

  logAction(user.id, 'SAVE_ATTEMPT', `Attempt saved for ${examId}`);
  return { id, percentage };
}

function handleGetMyAttempts(user) {
  if (!user) throw new Error('Unauthorized');
  const data = getSheet(TABLES.EXAM_ATTEMPTS).getDataRange().getValues();
  const headers = data[0];
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === user.id) list.push(rowToObject(data[i], headers));
  }
  return list;
}

function handleGetAttemptReview(user, id) {
  if (!user) throw new Error('Unauthorized');
  const data = getSheet(TABLES.EXAM_ATTEMPTS).getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const obj = rowToObject(data[i], headers);
      if (obj.user_id !== user.id && user.role !== 'admin') throw new Error('Forbidden');
      obj.answers = JSON.parse(obj.answers_json);
      obj.questionsSnapshot = JSON.parse(obj.questions_snapshot_json);
      return obj;
    }
  }
  throw new Error('Not found');
}

function handleGetLeaderboard(examId) {
  const data = getSheet(TABLES.EXAM_ATTEMPTS).getDataRange().getValues();
  const users = getSheet(TABLES.USERS).getDataRange().getValues();
  const userMap = {};
  for(let i=1; i<users.length; i++) userMap[users[i][0]] = users[i][1];

  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (!examId || data[i][2] === examId) {
      list.push({
        username: userMap[data[i][1]] || 'Anonymous',
        score: data[i][3],
        percent: data[i][5],
        createdAt: data[i][10]
      });
    }
  }
  return list.sort((a,b) => b.percent - a.percent).slice(0, 50);
}

// --- Admin Handlers ---

function handleAdminGetStats(user) {
  checkAdmin(user);
  const users = getSheet(TABLES.USERS).getDataRange().getValues();
  const exams = getSheet(TABLES.EXAMS).getDataRange().getValues();
  const attempts = getSheet(TABLES.EXAM_ATTEMPTS).getDataRange().getValues();

  const stats = {
    users: { total: Math.max(0, users.length - 1), active: 0, blocked: 0, free: 0, pro: 0, admins: 0 },
    exams: { total: Math.max(0, exams.length - 1) },
    attempts: { total: Math.max(0, attempts.length - 1), avgScore: 0 },
    recentAttempts: []
  };

  if (users.length > 1) {
    const headers = users[0];
    const roleIdx = headers.indexOf('role');
    const statusIdx = headers.indexOf('status');
    const planIdx = headers.indexOf('plan');

    for (let i = 1; i < users.length; i++) {
      const u = users[i];
      if (u[statusIdx] === 'active') stats.users.active++;
      else stats.users.blocked++;
      if (u[planIdx] === 'pro') stats.users.pro++;
      else stats.users.free++;
      if (u[roleIdx] === 'admin') stats.users.admins++;
    }
  }

  if (attempts.length > 1) {
    let totalPct = 0;
    for (let i = 1; i < attempts.length; i++) {
      totalPct += parseFloat(attempts[i][5]) || 0;
      if (i > attempts.length - 6) stats.recentAttempts.push({ percentage: attempts[i][5], created_at: attempts[i][10] });
    }
    stats.attempts.avgScore = stats.attempts.total > 0 ? Math.round(totalPct / stats.attempts.total) : 0;
  }

  return stats;
}

function handleAdminGetUsers(user) {
  checkAdmin(user);
  const data = getSheet(TABLES.USERS).getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = rowToObject(row, headers);
    delete obj.password_hash;
    delete obj.salt;
    return obj;
  });
}

function handleAdminUpdateUser(user, payload) {
  checkAdmin(user);
  const { userId, updates } = payload;
  const sheet = getSheet(TABLES.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  let rowIdx = -1;
  for(let i=1; i<data.length; i++) {
    if(data[i][0] === userId) {
      rowIdx = i;
      break;
    }
  }
  if(rowIdx === -1) throw new Error('User not found');

  Object.keys(updates).forEach(key => {
    const colIdx = headers.indexOf(key);
    if(colIdx !== -1) sheet.getRange(rowIdx + 1, colIdx + 1).setValue(updates[key]);
  });
  return { success: true };
}

function handleAdminGetAllExams(user) {
  checkAdmin(user);
  const data = getSheet(TABLES.EXAMS).getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => rowToObject(row, headers));
}

function handleAdminGetAllAttempts(user) {
  checkAdmin(user);
  const data = getSheet(TABLES.EXAM_ATTEMPTS).getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => rowToObject(row, headers));
}

// --- Internal Helpers ---

function checkAdmin(user) {
  if (!user) throw new Error('Unauthorized');
  const isAdmin = user.role === 'admin' || SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === (user.email || '').toLowerCase().trim());
  if (!isAdmin) throw new Error('Unauthorized: Admin access required');
}

function getUserByToken(token) {
  if (!token) return null;
  const hash = hashToken(token);
  const sheet = getSheet(TABLES.SESSIONS);
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === hash) {
      if (new Date(data[i][3]) > now) return getUserById(data[i][1]);
      break;
    }
  }
  return null;
}

function getUserById(id) {
  const sheet = getSheet(TABLES.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) return rowToObject(data[i], headers);
  }
  throw new Error('User not found');
}

function rowToObject(row, headers) {
  const obj = {};
  headers.forEach((h, i) => obj[h] = row[i]);
  return obj;
}

// --- AI Handlers ---

/**
 * ONE-TIME SETUP: Run this function once in the Apps Script editor 
 * to securely save your API key.
 */
function SETUP_OPENROUTER_KEY() {
  const apiKey = "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"; 
  PropertiesService.getScriptProperties().setProperty('OPENROUTER_API_KEY', apiKey);
  Logger.log("✅ API Key saved successfully!");
}

function handleAIChat(user, payload) {
  if (!user) throw new Error('Unauthorized');
  const { messages, context } = payload;
  
  // Build a smart system prompt based on user role/plan
  const systemPrompt = `You are the MEDEXAM AI Mentor, a premium medical education assistant.
- Your goal is to provide high-level academic support, exam strategies, and concept explanations.
- Name: MEDEXAM AI PRO.
- Context: Medical education for the student ${user.username}.
- Language: English (Crucial: Always respond in English).
- Tone: Professional, expert, and clinically precise.
- Capabilities: You can analyze exam results, explain complex medical topics, and provide study plans.
- Important: Do NOT mention technical details about the backend infrastructure.`;

  const chatHistory = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const response = callOpenRouter(chatHistory, context?.apiKey);
  logAction(user.id, 'AI_CHAT', `Interaction on ${context?.pageTitle || 'unknown'}`);
  
  return { content: response };
}

function handleAIExplain(user, payload) {
  if (!user) throw new Error('Unauthorized');
  const { questionContext } = payload;
  
  const prompt = `You are the MEDEXAM Specialist. Explain the following question to a medical student.
  
Context:
- Question: ${questionContext.questionText}
- Options: ${JSON.stringify(questionContext.options)}
- Correct: ${questionContext.correctOption}
- Student choice: ${questionContext.studentOption || 'None'}
- Status: ${questionContext.isCorrect ? 'Correct' : 'Incorrect'}

Requirements:
1. Explain the medical rationale for the correct answer.
2. Analyze why the student's choice was ${questionContext.isCorrect ? 'right' : 'wrong'}.
3. Clarify why other distractors are incorrect.
4. Provide a "Clinical Pearl" or a key takeaway.

Guidelines:
- Language: English (Crucial: Always respond in English).
- Tone: Professional, academic, and clear.
- Brand: Refer to yourself as MEDEXAM AI Specialist.`;

  const response = callOpenRouter([{ role: 'user', content: prompt }], questionContext?.apiKey);
  logAction(user.id, 'AI_EXPLAIN', `Explained question: ${questionContext.questionText.substring(0, 30)}...`);
  
  return { content: response };
}

function callOpenRouter(messages, payloadKey) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = payloadKey || props.getProperty('OPENROUTER_API_KEY');
  
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    return "⚠️ Error: API Key not found. Please ensure VITE_OPENROUTER_API_KEY is configured in your cloud settings.";
  }

  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const payload = {
    model: 'google/gemini-2.0-flash-001', 
    messages: messages,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'HTTP-Referer': 'https://imtihani-pro.com', 
      'X-Title': 'Imtihani Pro'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const text = response.getContentText();
    const code = response.getResponseCode();
    
    if (code !== 200) {
      Logger.log(`❌ AI Provider Error (${code}): ${text}`);
      throw new Error(`Cloud AI Error (${code}). Check your API key and balance.`);
    }

    const json = JSON.parse(text);
    if (json.choices && json.choices[0]) {
      return json.choices[0].message.content;
    } else {
      Logger.log('❌ Unexpected AI Response: ' + text);
      throw new Error('AI Engine returned an empty response. Possible model overload.');
    }
  } catch (e) {
    Logger.log('❌ AI Exception: ' + e.message);
    throw new Error('Could not connect to MEDEXAM AI: ' + e.message);
  }
}

let _ssCache = null;
function getSs() {
  if (!_ssCache) _ssCache = SpreadsheetApp.openById(SPREADSHEET_ID);
  return _ssCache;
}

function getSheet(name) {
  const ss = getSs();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS[name]);
  }
  return sheet;
}

function hashPassword(pass, salt) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pass + salt).map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function hashToken(token) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token).map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function generateUUID() { return Utilities.getUuid(); }

function logAction(userId, action, details) {
  try {
    getSheet(TABLES.AUDIT_LOG).appendRow([generateUUID(), userId || 'SYSTEM', action, details, '', new Date().toISOString()]);
  } catch (e) {}
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * THE MASTER SETUP:
 * Run this function to initialize your database correctly.
 */
function MASTER_DATABASE_SETUP() {
  const ss = getSs();
  Object.keys(TABLES).forEach(key => {
    const name = TABLES[key];
    let sheet = ss.getSheetByName(name);
    if (sheet) {
      // Clear existing to start fresh if needed, or just update headers
      sheet.clear();
    } else {
      sheet = ss.insertSheet(name);
    }
    sheet.appendRow(HEADERS[name]);
    // Format headers
    sheet.getRange(1, 1, 1, HEADERS[name].length).setFontWeight('bold').setBackground('#f3f4f6');
    sheet.setFrozenRows(1);
  });
  
  Logger.log('✅ MASTER SETUP COMPLETE. All sheets initialized with correct headers.');
}

/**
 * THE ULTIMATE ADMIN FIX:
 * Run this to create/reset your admin account.
 */
function ULTIMATE_ADMIN_FIX() {
  const email = 'wasemkhallaf86@gmail.com';
  const username = 'waseem';
  const pass = '88962334';
  
  const sheet = getSheet(TABLES.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  let userIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][2].toString().toLowerCase() === email.toLowerCase()) {
      userIdx = i;
      break;
    }
  }

  const salt = generateUUID();
  const hash = hashPassword(pass, salt);
  const now = new Date().toISOString();
  const id = userIdx !== -1 ? data[userIdx][0] : generateUUID();
  const fullUserRow = [id, username, email, hash, salt, 'admin', 'active', 'pro', 999, 0, now, now, ''];

  if (userIdx !== -1) {
    sheet.getRange(userIdx + 1, 1, 1, fullUserRow.length).setValues([fullUserRow]);
  } else {
    sheet.appendRow(fullUserRow);
  }
  
  SpreadsheetApp.flush();
  Logger.log('✅ ADMIN ACCOUNT READY: ' + email);
}
