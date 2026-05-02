/**
 * EXAM Backend - Google Apps Script (Version 3.0 - Admin & Plans)
 * This script acts as the backend for the EXAM project, using Google Sheets as a database.
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
  PASSWORD_RESETS: 'PasswordResets',
  AUDIT_LOG: 'AuditLog'
};

const HEADERS = {
  [TABLES.USERS]: ['id', 'username', 'email', 'password_hash', 'salt', 'role', 'status', 'plan', 'trial_limit', 'attempt_count', 'created_at', 'updated_at', 'last_login'],
  [TABLES.SESSIONS]: ['id', 'user_id', 'token_hash', 'expires_at', 'created_at'],
  [TABLES.EXAMS]: ['id', 'user_id', 'title', 'description', 'grade', 'subject', 'tags_json', 'difficulty', 'time_limit_minutes', 'exam_data_json', 'is_public', 'status', 'featured', 'created_at', 'updated_at'],
  [TABLES.EXAM_ATTEMPTS]: ['id', 'user_id', 'exam_id', 'score', 'total_questions', 'percentage', 'answers_json', 'questions_snapshot_json', 'duration_seconds', 'mode', 'created_at'],
  [TABLES.PASSWORD_RESETS]: ['id', 'user_id', 'token_hash', 'expires_at', 'created_at'],
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

    const props = PropertiesService.getScriptProperties();
    const currentVersion = '3.0.1';
    if (props.getProperty('DB_VERSION') !== currentVersion) {
      initSheets();
      runMigration();
      props.setProperty('DB_VERSION', currentVersion);
    }

    let user = null;
    if (token) {
      user = getUserByToken(token);
    }

    let result;
    switch (action) {
      case 'health':
        result = { status: 'ok', version: '3.0.0', db: TABLES.USERS };
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

      default:
        throw new Error('Unknown action: ' + action);
    }

    return createResponse({ ok: true, data: result });
  } catch (error) {
    return createResponse({ ok: false, error: error.message || String(error) });
  }
}

function doGet(e) {
  return createResponse({ status: 'ok', info: 'EXAM API v3' });
}

// --- Auth Handlers ---

function handleRegister(payload) {
  const { username, password, email } = payload;
  const sheet = getSheet(TABLES.USERS);
  const data = sheet.getDataRange().getValues();

  // Check unique
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toLowerCase() === username.toLowerCase()) throw new Error('Username taken');
    if (data[i][2].toLowerCase() === email.toLowerCase()) throw new Error('Email taken');
  }

  const salt = generateUUID();
  const passwordHash = hashPassword(password, salt);
  const id = generateUUID();
  const isFirst = data.length === 1;
  const role = isFirst ? 'admin' : 'user';
  const now = new Date().toISOString();

  // ['id', 'username', 'email', 'password_hash', 'salt', 'role', 'status', 'plan', 'trial_limit', 'attempt_count', 'created_at', 'updated_at', 'last_login']
  const newUser = [id, username, email, passwordHash, salt, role, 'active', 'free', 4, 0, now, now, ''];
  sheet.appendRow(newUser);
  logAction(id, 'REGISTER', `New user: ${username}`);
  
  return handleLogin({ username, password });
}

function handleLogin(payload) {
  const { username, password } = payload;
  const sheet = getSheet(TABLES.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let userIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toLowerCase() === username.toLowerCase() || data[i][2].toLowerCase() === username.toLowerCase()) {
      userIdx = i;
      break;
    }
  }

  if (userIdx === -1) throw new Error('Invalid credentials');
  const userRow = data[userIdx];
  const user = rowToObject(userRow, headers);

  if (user.status === 'blocked') throw new Error('Account is blocked. Contact support.');
  if (hashPassword(password, user.salt) !== user.password_hash) throw new Error('Invalid credentials');

  const token = generateUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  getSheet(TABLES.SESSIONS).appendRow([generateUUID(), user.id, tokenHash, expiresAt, new Date().toISOString()]);
  
  // Update last login
  const lastLoginCol = headers.indexOf('last_login') + 1;
  sheet.getRange(userIdx + 1, lastLoginCol).setValue(new Date().toISOString());

  logAction(user.id, 'LOGIN', `Login successful`);

  // Auto-promote Super Admins
  if (SUPER_ADMIN_EMAILS.includes(user.email) && (user.role !== 'admin' || user.plan !== 'pro')) {
    sheet.getRange(userIdx + 1, 6).setValue('admin'); // Role
    sheet.getRange(userIdx + 1, 8).setValue('pro');   // Plan
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
  
  // Refresh data from DB
  const dbUser = getUserById(user.id);
  
  // Auto-promote Super Admins
  if (SUPER_ADMIN_EMAILS.includes(dbUser.email) && (dbUser.role !== 'admin' || dbUser.plan !== 'pro')) {
    const sheet = getSheet(TABLES.USERS);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === dbUser.id) {
        sheet.getRange(i + 1, 6).setValue('admin'); // Role
        sheet.getRange(i + 1, 8).setValue('pro');   // Plan
        dbUser.role = 'admin';
        dbUser.plan = 'pro';
        break;
      }
    }
  }

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

  // ['id', 'user_id', 'title', 'description', 'grade', 'subject', 'tags_json', 'difficulty', 'time_limit_minutes', 'exam_data_json', 'is_public', 'status', 'featured', 'created_at', 'updated_at']
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
    if (data[i][1] === user.id) {
      exams.push(rowToObject(data[i], headers));
    }
  }
  return exams;
}

function handleGetPublicExams() {
  const data = getSheet(TABLES.EXAMS).getDataRange().getValues();
  const headers = data[0];
  const exams = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][10] === 'TRUE' || data[i][11] === 'published') {
      exams.push(rowToObject(data[i], headers));
    }
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

  // Plan enforcement
  if (dbUser.role !== 'admin' && dbUser.plan === 'free') {
    if (dbUser.attempt_count >= dbUser.trial_limit) {
      throw new Error('Trial limit reached. Please upgrade to PRO for unlimited attempts.');
    }
  }

  const { examId, score, totalQuestions, answers, durationSeconds, questionsSnapshot, mode } = payload;
  const percentage = Math.round((score / totalQuestions) * 100);
  const id = generateUUID();
  const now = new Date().toISOString();

  // ['id', 'user_id', 'exam_id', 'score', 'total_questions', 'percentage', 'answers_json', 'questions_snapshot_json', 'duration_seconds', 'mode', 'created_at']
  getSheet(TABLES.EXAM_ATTEMPTS).appendRow([
    id, user.id, examId, score, totalQuestions, percentage,
    JSON.stringify(answers), JSON.stringify(questionsSnapshot || []),
    durationSeconds, mode || 'normal', now
  ]);

  // Increment attempt count
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
  const exams = getSheet(TABLES.EXAMS).getDataRange().getValues();
  const examMap = {};
  for(let i=1; i<exams.length; i++) examMap[exams[i][0]] = exams[i][2];

  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === user.id) {
      const obj = rowToObject(data[i], headers);
      obj.examTitle = examMap[obj.exam_id] || 'Curriculum Exam';
      list.push(obj);
    }
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
        totalQuestions: data[i][4],
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
    exams: { total: Math.max(0, exams.length - 1), public: 0, private: 0 },
    attempts: { total: Math.max(0, attempts.length - 1), avgScore: 0 },
    recentUsers: [],
    recentAttempts: []
  };

  if (users.length > 1) {
    const userHeaders = users[0];
    for(let i=1; i<users.length; i++) {
      const u = rowToObject(users[i], userHeaders);
      if(u.status === 'active') stats.users.active++;
      else stats.users.blocked++;
      if(u.plan === 'pro') stats.users.pro++;
      else stats.users.free++;
      if(u.role === 'admin') stats.users.admins++;
      if(i > users.length - 6) stats.recentUsers.push({ username: u.username, email: u.email, created_at: u.created_at });
    }
  }

  if (exams.length > 1) {
    for(let i=1; i<exams.length; i++) {
      if(exams[i][10] === true || String(exams[i][10]).toUpperCase() === 'TRUE') stats.exams.public++;
      else stats.exams.private++;
    }
  }

  if (attempts.length > 1) {
    let totalPct = 0;
    for(let i=1; i<attempts.length; i++) {
      totalPct += parseFloat(attempts[i][5]) || 0;
      if(i > attempts.length - 6) stats.recentAttempts.push({ user_id: attempts[i][1], exam_id: attempts[i][2], percentage: attempts[i][5], created_at: attempts[i][10] });
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

  // Prevent removing last admin
  if(updates.role === 'user' && data[rowIdx][headers.indexOf('role')] === 'admin') {
    let adminCount = 0;
    for(let i=1; i<data.length; i++) if(data[i][headers.indexOf('role')] === 'admin') adminCount++;
    if(adminCount <= 1) throw new Error('Cannot remove the last administrator');
  }

  const now = new Date().toISOString();
  Object.keys(updates).forEach(key => {
    const colIdx = headers.indexOf(key);
    if(colIdx !== -1) {
      sheet.getRange(rowIdx + 1, colIdx + 1).setValue(updates[key]);
    }
  });
  sheet.getRange(rowIdx + 1, headers.indexOf('updated_at') + 1).setValue(now);

  logAction(user.id, 'ADMIN_UPDATE_USER', `Updated user ${userId}: ${JSON.stringify(updates)}`);
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
  const users = getSheet(TABLES.USERS).getDataRange().getValues();
  const userMap = {};
  for(let i=1; i<users.length; i++) userMap[users[i][0]] = users[i][1];

  return data.slice(1).map(row => {
    const obj = rowToObject(row, headers);
    obj.username = userMap[obj.user_id] || 'Unknown';
    return obj;
  });
}

// --- Internal Helpers ---

function checkAdmin(user) {
  if (!user || user.role !== 'admin') throw new Error('Forbidden: Admin access required');
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
  headers.forEach((h, i) => {
    obj[h] = row[i];
  });
  return obj;
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

function initSheets() {
  const ss = getSs();
  Object.values(TABLES).forEach(tableName => {
    if (!ss.getSheetByName(tableName)) {
      const sheet = ss.insertSheet(tableName);
      sheet.appendRow(HEADERS[tableName]);
    }
  });
}

function runMigration() {
  const ss = getSs();
  Object.keys(TABLES).forEach(key => {
    const tableName = TABLES[key];
    const expectedHeaders = HEADERS[tableName];
    const sheet = ss.getSheetByName(tableName);
    if (!sheet) return;
    
    const actualHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
    
    expectedHeaders.forEach(h => {
      if (actualHeaders.indexOf(h) === -1) {
        sheet.insertColumnAfter(sheet.getLastColumn());
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
      }
    });
  });
}

function hashPassword(pass, salt) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pass + salt)
    .map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function hashToken(token) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token)
    .map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
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
 * Run this to check if your Sheets are set up correctly.
 * View the results in the Execution Log.
 */
function DEBUG_CHECK_DB() {
  const ss = getSs();
  Object.keys(TABLES).forEach(key => {
    const name = TABLES[key];
    const sheet = ss.getSheetByName(name);
    if (!sheet) {
      Logger.log('❌ MISSING SHEET: ' + name);
    } else {
      const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
      const expected = HEADERS[name];
      const missing = expected.filter(h => headers.indexOf(h) === -1);
      
      if (missing.length > 0) {
        Logger.log('⚠️ SHEET ' + name + ' is missing columns: ' + missing.join(', '));
      } else {
        Logger.log('✅ SHEET ' + name + ' is perfect.');
      }
    }
  });
}
/**
 * THE ULTIMATE FIX:
 * Run this to GUARANTEE your account works.
 * It will create the account if missing, or reset it if it exists.
 */
function ULTIMATE_ADMIN_FIX() {
  const email = 'wasemkhallaf86@gmail.com';
  const username = 'Waseem KH';
  const pass = '88962334';
  
  const sheet = getSheet(TABLES.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  let userIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][2].toLowerCase() === email.toLowerCase()) {
      userIdx = i;
      break;
    }
  }

  const salt = generateUUID();
  const hash = hashPassword(pass, salt);
  const now = new Date().toISOString();

  if (userIdx !== -1) {
    // RESET EXISTING
    sheet.getRange(userIdx + 1, 4).setValue(hash);   // password_hash
    sheet.getRange(userIdx + 1, 5).setValue(salt);   // salt
    sheet.getRange(userIdx + 1, 6).setValue('admin'); // role
    sheet.getRange(userIdx + 1, 8).setValue('pro');   // plan
    Logger.log('✅ EXISTING ACCOUNT RESET: ' + email);
  } else {
    // CREATE NEW
    const id = generateUUID();
    // ['id', 'username', 'email', 'password_hash', 'salt', 'role', 'status', 'plan', 'trial_limit', 'attempt_count', 'created_at', 'updated_at', 'last_login']
    const newUser = [id, username, email, hash, salt, 'admin', 'active', 'pro', 999, 0, now, now, ''];
    sheet.appendRow(newUser);
    Logger.log('✅ NEW ADMIN ACCOUNT CREATED: ' + email);
  }
  
  return 'Success! Now log in with Waseem / 88962334';
}

// --- Maintenance & Automation ---

/**
 * Resets trial limits and attempt counts for all 'free' users.
 * Setup a Time-driven trigger in Apps Script to run this monthly.
 */
function resetMonthlyTrialLimits() {
  const sheet = getSheet(TABLES.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const planIdx = headers.indexOf('plan');
  const limitIdx = headers.indexOf('trial_limit');
  const countIdx = headers.indexOf('attempt_count');
  
  if (planIdx === -1 || limitIdx === -1 || countIdx === -1) {
    Logger.log('Error: Required columns not found');
    return;
  }

  // Define your default monthly limits here
  const DEFAULT_MONTHLY_LIMIT = 5;

  for (let i = 1; i < data.length; i++) {
    if (data[i][planIdx] === 'free') {
      // Update Trial Limit to 5
      sheet.getRange(i + 1, limitIdx + 1).setValue(DEFAULT_MONTHLY_LIMIT);
      // Reset Attempt Count to 0
      sheet.getRange(i + 1, countIdx + 1).setValue(0);
    }
  }
  
  Logger.log('Monthly limits and attempt counts have been reset.');
}
