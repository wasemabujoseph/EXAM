/**
 * MEDEXAM Core Backend (Version 3.3.0-material-viewer)
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
  AUDIT_LOG: 'AuditLog',
  MATERIALS: 'Materials'
};

const HEADERS = {
  [TABLES.USERS]: ['id', 'username', 'email', 'password_hash', 'salt', 'role', 'status', 'plan', 'trial_limit', 'attempt_count', 'created_at', 'updated_at', 'last_login'],
  [TABLES.SESSIONS]: ['id', 'user_id', 'token_hash', 'expires_at', 'created_at'],
  [TABLES.EXAMS]: ['id', 'user_id', 'title', 'description', 'grade', 'subject', 'tags_json', 'difficulty', 'time_limit_minutes', 'exam_data_json', 'is_public', 'status', 'featured', 'created_at', 'updated_at'],
  [TABLES.EXAM_ATTEMPTS]: ['id', 'user_id', 'exam_id', 'score', 'total_questions', 'percentage', 'answers_json', 'questions_snapshot_json', 'duration_seconds', 'mode', 'created_at'],
  [TABLES.AUDIT_LOG]: ['id', 'user_id', 'action', 'details', 'ip_address', 'created_at'],
  [TABLES.MATERIALS]: ['id', 'fileId', 'previewFileId', 'title', 'description', 'year', 'subject', 'type', 'originalFilename', 'mimeType', 'previewMimeType', 'previewStatus', 'sizeBytes', 'driveUrl', 'previewUrl', 'downloadUrl', 'thumbnailUrl', 'tags', 'uploadedBy', 'uploadedAt', 'updatedAt', 'isVisibleToStudents', 'examQuestionCount', 'isProtected'],
  'SECURITY_EVENTS': ['id', 'user_id', 'eventType', 'page', 'materialId', 'examId', 'attemptId', 'timestamp', 'userAgent']
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
        result = { status: 'ok', version: '3.3.0-material-viewer', db: TABLES.USERS };
        break;
      case 'serverCapabilities':
        result = {
          version: "3.3.0-material-viewer",
          actions: [
            "uploadMaterial",
            "listMaterials",
            "getMaterialById",
            "getMaterialFileData",
            "getMaterialContent",
            "updateMaterialContent",
            "replaceMaterialFile",
            "syncMaterialsFromDrive",
            "materialsHealth",
            "adminUpdateExam",
            "adminUpdateExamJson",
            "logSecurityEvent",
            "validateExamAccess",
            "repairMaterialsMetadata"
          ]
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
      case 'adminUpdateExam':
        result = handleAdminUpdateExam(user, payload);
        break;
      case 'adminUpdateExamJson':
        result = handleAdminUpdateExamJson(user, payload);
        break;
      
      // AI Actions
      case 'aiChat':
        result = handleAIChat(user, payload);
        break;
      case 'aiExplain':
        result = handleAIExplain(user, payload);
        break;
      
      // Materials Actions
      case 'uploadMaterial':
        result = handleUploadMaterial(user, payload);
        break;
      case 'listMaterials':
        result = handleListMaterials(user, payload);
        break;
      case 'getMaterialById':
        result = handleGetMaterialById(user, payload.id);
        break;
      case 'getMaterialContent':
        result = handleGetMaterialContent(user, payload.id);
        break;
      case 'updateMaterialMetadata':
        result = handleUpdateMaterialMetadata(user, payload);
        break;
      case 'deleteMaterial':
        result = handleDeleteMaterial(user, payload.id);
        break;
      case 'getMaterialFileData':
        result = handleGetMaterialFileData(user, payload.id);
        break;
      case 'updateMaterialContent':
        result = handleUpdateMaterialContent(user, payload);
        break;
      case 'replaceMaterialFile':
        result = handleReplaceMaterialFile(user, payload);
        break;
      case 'syncMaterialsFromDrive':
        result = handleSyncMaterialsFromDrive(user);
        break;
      case 'materialsHealth':
        result = handleMaterialsHealth(user);
        break;
      case 'logSecurityEvent':
        result = handleLogSecurityEvent(user, payload);
        break;
      case 'validateExamAccess':
        result = handleValidateExamAccess(user, payload);
        break;
      case 'repairMaterialsMetadata':
        result = handleRepairMaterialsMetadata(user);
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
    version: '3.3.0-material-viewer',
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
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('No users found');

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const usernameCol = headers.indexOf('username') + 1;
  const emailCol = headers.indexOf('email') + 1;
  
  // Read only the columns we need for searching
  const usernames = sheet.getRange(2, usernameCol, lastRow - 1, 1).getValues();
  const emails = sheet.getRange(2, emailCol, lastRow - 1, 1).getValues();

  const searchVal = (username || '').toString().toLowerCase().trim();
  if (!searchVal) throw new Error('Username or email is required');

  let userIdx = -1;
  for (let i = 0; i < usernames.length; i++) {
    const rowUsername = (usernames[i][0] || '').toString().toLowerCase().trim();
    const rowEmail = (emails[i][0] || '').toString().toLowerCase().trim();
    if (rowUsername === searchVal || rowEmail === searchVal) {
      userIdx = i + 1; // +1 because i is 0-indexed, but range starts at row 2
      break;
    }
  }

  if (userIdx === -1) throw new Error('Invalid credentials');
  
  // Now read the full user row
  const userRow = sheet.getRange(userIdx + 1, 1, 1, headers.length).getValues()[0];
  const user = rowToObject(userRow, headers);

  if (user.status === 'blocked') throw new Error('Account is blocked.');
  if (hashPassword(password, user.salt) !== user.password_hash) throw new Error('Invalid credentials');

  const token = generateUUID();
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Optimized session storage
  const sessionSheet = getSheet(TABLES.SESSIONS);
  sessionSheet.appendRow([generateUUID(), user.id, tokenHash, expiresAt, now.toISOString()]);
  
  // Update last login
  const lastLoginCol = headers.indexOf('last_login') + 1;
  if (lastLoginCol > 0) sheet.getRange(userIdx + 1, lastLoginCol).setValue(now.toISOString());

  // Check for admin/pro promotion
  const isSuperAdmin = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === (user.email || '').toLowerCase().trim());
  if (isSuperAdmin && (user.role !== 'admin' || user.plan !== 'pro')) {
    const roleCol = headers.indexOf('role') + 1;
    const planCol = headers.indexOf('plan') + 1;
    if (roleCol > 0) sheet.getRange(userIdx + 1, roleCol).setValue('admin');
    if (planCol > 0) sheet.getRange(userIdx + 1, planCol).setValue('pro');
    user.role = 'admin';
    user.plan = 'pro';
  }

  // Cleanup old sessions for this user (max 10 sessions)
  try {
     cleanupSessions(user.id);
  } catch(e) {}

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status, plan: user.plan }
  };
}

function cleanupSessions(userId) {
  const sheet = getSheet(TABLES.SESSIONS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  const data = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // Get user_id column
  const now = new Date();
  
  // Simple cleanup: delete rows that match this user but are older than 7 days
  // Or just keep the most recent ones. For now, let's just delete expired ones.
  const expiresData = sheet.getRange(2, 4, lastRow - 1, 1).getValues(); // Get expires_at column
  
  let deletedCount = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i][0] === userId) {
       const expiry = new Date(expiresData[i][0]);
       if (expiry < now) {
         sheet.deleteRow(i + 2);
         deletedCount++;
       }
    }
  }
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
  
  const { examId, score, totalQuestions, answers, durationSeconds, questionsSnapshot, mode } = payload;
  const percentage = Math.round((score / totalQuestions) * 100);
  const id = generateUUID();
  const now = new Date().toISOString();

  getSheet(TABLES.EXAM_ATTEMPTS).appendRow([
    id, user.id, examId, score, totalQuestions, percentage,
    JSON.stringify(answers), JSON.stringify(questionsSnapshot || []),
    durationSeconds, mode || 'normal', now
  ]);

  // Update user attempt count efficiently
  const userSheet = getSheet(TABLES.USERS);
  const lastRow = userSheet.getLastRow();
  const ids = userSheet.getRange(2, 1, lastRow - 1, 1).getValues();
  
  let userIdx = -1;
  for(let i=0; i<ids.length; i++) {
    if(ids[i][0] === user.id) {
      userIdx = i + 2;
      break;
    }
  }

  if (userIdx !== -1) {
    const headers = userSheet.getRange(1, 1, 1, userSheet.getLastColumn()).getValues()[0];
    const countCol = headers.indexOf('attempt_count') + 1;
    const updateCol = headers.indexOf('updated_at') + 1;
    
    if (countCol > 0) {
      const currentCount = parseInt(userSheet.getRange(userIdx, countCol).getValue()) || 0;
      userSheet.getRange(userIdx, countCol).setValue(currentCount + 1);
    }
    if (updateCol > 0) userSheet.getRange(userIdx, updateCol).setValue(now);
  }

  logAction(user.id, 'SAVE_ATTEMPT', `Attempt saved for ${examId}`);
  return { id, percentage };
}

function handleGetMyAttempts(user) {
  if (!user) throw new Error('Unauthorized');
  const sheet = getSheet(TABLES.EXAM_ATTEMPTS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
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

// --- Materials Handlers ---

function handleUploadMaterial(user, payload) {
  checkAdmin(user);
  const { title, description, year, subject, type, tags, fileName, mimeType, fileBase64, isVisibleToStudents, isProtected } = payload;
  
  if (!fileBase64) throw new Error('No file data received');
  
  const rootFolderId = PropertiesService.getScriptProperties().getProperty('MATERIALS_ROOT_FOLDER_ID');
  if (!rootFolderId) {
    throw new Error("Materials folder is not configured.");
  }

  // 1. Create Folder Structure: Year / Subject / Type
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  const yearFolder = getOrCreateSubFolder(rootFolder, `Year ${year}`);
  const subjectFolder = getOrCreateSubFolder(yearFolder, subject);
  const typeFolder = getOrCreateSubFolder(subjectFolder, type === 'exam' ? 'Exams' : type === 'pdf' ? 'PDFs' : type.includes('image') ? 'Images' : type.includes('ppt') ? 'PowerPoints' : 'Other');

  // 2. Decode Base64 and Save File
  const fileData = Utilities.base64Decode(fileBase64);
  const blob = Utilities.newBlob(fileData, mimeType, fileName);
  const file = typeFolder.createFile(blob);
  
  const fileId = file.getId();
  const now = new Date().toISOString();
  const id = generateUUID();
  const warnings = [];

  // 3. Set Sharing (Resilient)
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    const msg = "File uploaded, but public link sharing could not be applied automatically. Please check Drive settings.";
    warnings.push(msg);
    Logger.log("Sharing warning: " + err.message);
  }
  
  let examQuestionCount = 0;
  if (type === 'exam') {
    try {
      const jsonContent = blob.getDataAsString();
      const examData = JSON.parse(jsonContent);
      examQuestionCount = Array.isArray(examData.questions) ? examData.questions.length : 0;
    } catch (e) {
      Logger.log('Failed to parse exam JSON: ' + e.message);
    }
  }

  let thumbnailUrl = null;
  try {
    const thumb = file.getThumbnail();
    if (thumb) thumbnailUrl = null; 
  } catch (err) {
    Logger.log("Thumbnail warning: " + err.message);
  }

  const material = {
    id,
    fileId,
    previewFileId: null,
    title,
    description,
    year,
    subject,
    type,
    originalFilename: fileName,
    mimeType,
    previewMimeType: null,
    previewStatus: 'ready',
    sizeBytes: file.getSize(),
    driveUrl: file.getUrl(),
    previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    thumbnailUrl: thumbnailUrl,
    tags: JSON.stringify(tags || []),
    uploadedBy: user.username,
    uploadedAt: now,
    updatedAt: now,
    isVisibleToStudents: isVisibleToStudents === true || isVisibleToStudents === 'true' ? 'TRUE' : 'FALSE',
    examQuestionCount,
    isProtected: isProtected === true || isProtected === 'true' || type === 'exam' ? 'TRUE' : 'FALSE'
  };

  // 4. Handle Office Conversion (PPTX, DOCX)
  if (['application/vnd.openxmlformats-officedocument.presentationml.presentation', 
       'application/vnd.ms-powerpoint',
       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
       'application/msword'].includes(mimeType)) {
    try {
      const previewFileId = convertOfficeToPdf(fileId, typeFolder);
      if (previewFileId) {
        material.previewFileId = previewFileId;
        material.previewMimeType = 'application/pdf';
        material.previewStatus = 'converted';
      }
    } catch (e) {
      material.previewStatus = 'failed';
      warnings.push("Office to PDF conversion failed. Student preview may be limited.");
      Logger.log('Conversion error: ' + e.message);
    }
  }

  const sheet = getSheet(TABLES.MATERIALS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => material[h]);
  sheet.appendRow(row);

  logAction(user.id, 'UPLOAD_MATERIAL', `Uploaded: ${title} (${type})`);
  
  return { material, warnings };
}

function handleSyncMaterialsFromDrive(user) {
  checkAdmin(user);
  const rootFolderId = PropertiesService.getScriptProperties().getProperty('MATERIALS_ROOT_FOLDER_ID');
  if (!rootFolderId) throw new Error("Materials root folder ID is not configured.");

  const sheet = getSheet(TABLES.MATERIALS);
  const existingData = sheet.getDataRange().getValues();
  const existingFileIds = new Set(existingData.slice(1).map(row => row[1])); 

  const results = { added: 0, skipped: 0, errors: [] };
  const now = new Date().toISOString();
  const rootFolder = DriveApp.getFolderById(rootFolderId);

  function scan(folder, pathParts) {
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const fileId = file.getId();

      if (existingFileIds.has(fileId)) {
        results.skipped++;
        continue;
      }

      try {
        const year = pathParts[0]?.replace('Year ', '') || 'Unknown';
        const subject = pathParts[1] || 'General';
        const typeFolderName = pathParts[2] || 'Other';
        
        let type = 'pdf';
        if (typeFolderName === 'Exams') type = 'exam';
        else if (typeFolderName === 'Images') type = 'image';
        else if (typeFolderName === 'PowerPoints') type = 'presentation';

        const id = Utilities.getUuid();
        const materialObj = {
          id: id,
          fileId: fileId,
          previewFileId: null,
          title: file.getName(),
          description: '',
          year: year,
          subject: subject,
          type: type,
          originalFilename: file.getName(),
          mimeType: file.getMimeType(),
          previewMimeType: null,
          previewStatus: 'ready',
          sizeBytes: file.getSize(),
          driveUrl: file.getUrl(),
          previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
          thumbnailUrl: null,
          tags: '[]',
          uploadedBy: user.username || 'Drive Sync',
          uploadedAt: now,
          updatedAt: now,
          isVisibleToStudents: 'TRUE',
          examQuestionCount: 0,
          isProtected: type === 'exam' ? 'TRUE' : 'FALSE'
        };

        const headers = HEADERS[TABLES.MATERIALS];
        const materialRow = headers.map(h => materialObj[h]);
        sheet.appendRow(materialRow);
        existingFileIds.add(fileId);
        results.added++;
      } catch (e) {
        results.errors.push(`Error adding ${file.getName()}: ${e.message}`);
      }
    }

    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      const sub = subfolders.next();
      scan(sub, [...pathParts, sub.getName()]);
    }
  }

  scan(rootFolder, []);
  return results;
}

function handleMaterialsHealth(user) {
  checkAdmin(user);
  const rootFolderId = PropertiesService.getScriptProperties().getProperty('MATERIALS_ROOT_FOLDER_ID');
  if (!rootFolderId) return { success: false, message: "Materials folder is not configured." };

  try {
    const folder = DriveApp.getFolderById(rootFolderId);
    const sheet = getSheet(TABLES.MATERIALS);
    ensureDatabaseHeaders();
    const count = Math.max(0, sheet.getLastRow() - 1);
    return {
      success: true,
      version: "3.3.0-material-viewer",
      hasGetMaterialFileData: true,
      folderName: folder.getName(),
      folderId: rootFolderId,
      materialsCount: count,
      message: "Materials system is healthy."
    };
  } catch (e) {
    return { success: false, message: "Error accessing materials folder: " + e.message };
  }
}

function handleLogSecurityEvent(user, payload) {
  if (!user) return { success: false };
  const sheet = getSheet('SecurityEvents');
  if (!sheet) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const newSheet = ss.insertSheet('SecurityEvents');
    newSheet.appendRow(HEADERS['SECURITY_EVENTS']);
  }
  
  const id = generateUUID();
  const now = new Date().toISOString();
  const row = [
    id,
    user.id,
    payload.eventType,
    payload.page || '',
    payload.materialId || '',
    payload.examId || '',
    payload.attemptId || '',
    now,
    payload.userAgent || ''
  ];
  
  getSheet('SecurityEvents').appendRow(row);
  return { success: true };
}

function handleValidateExamAccess(user, payload) {
  if (!user) throw new Error('Authentication required');
  
  const userRow = getSheet(TABLES.USERS).getDataRange().getValues().find(r => r[0] === user.id);
  if (!userRow) throw new Error('User record not found');
  
  const statusIdx = HEADERS[TABLES.USERS].indexOf('status');
  if (userRow[statusIdx] === 'blocked') {
    return { allowed: false, reason: 'Your account is currently locked.' };
  }
  
  return { 
    allowed: true, 
    userStatus: userRow[statusIdx],
    username: user.username
  };
}

function handleListMaterials(user, payload) {
  const sheet = getSheet(TABLES.MATERIALS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  const isAdmin = user && (user.role === 'admin' || SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === (user.email || '').toLowerCase().trim()));
  
  const materials = [];
  for (let i = 1; i < data.length; i++) {
    const obj = rowToObject(data[i], headers);
    if (isAdmin || obj.isVisibleToStudents === 'TRUE' || obj.isVisibleToStudents === true) {
      materials.push(obj);
    }
  }
  return materials;
}

function handleGetMaterialById(user, id) {
  const sheet = getSheet(TABLES.MATERIALS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const obj = rowToObject(data[i], headers);
      const isAdmin = user && (user.role === 'admin' || SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === (user.email || '').toLowerCase().trim()));
      if (!isAdmin && obj.isVisibleToStudents !== 'TRUE' && obj.isVisibleToStudents !== true) {
        throw new Error('Unauthorized');
      }
      return obj;
    }
  }
  throw new Error('Material not found');
}

function handleGetMaterialContent(user, id) {
  const material = handleGetMaterialById(user, id);
  const file = DriveApp.getFileById(material.fileId);
  return {
    content: file.getBlob().getDataAsString(),
    mimeType: file.getMimeType()
  };
}

function handleUpdateMaterialMetadata(user, payload) {
  checkAdmin(user);
  const { id, updates } = payload;
  const sheet = getSheet(TABLES.MATERIALS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      rowIdx = i;
      break;
    }
  }
  
  if (rowIdx === -1) throw new Error('Material not found');
  
  updates.updatedAt = new Date().toISOString();
  if (updates.isVisibleToStudents !== undefined) {
    updates.isVisibleToStudents = updates.isVisibleToStudents === true || updates.isVisibleToStudents === 'true' ? 'TRUE' : 'FALSE';
  }
  if (updates.tags) updates.tags = JSON.stringify(updates.tags);

  Object.keys(updates).forEach(key => {
    const colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      sheet.getRange(rowIdx + 1, colIdx + 1).setValue(updates[key]);
    }
  });
  
  return { success: true };
}

function handleDeleteMaterial(user, id) {
  checkAdmin(user);
  const sheet = getSheet(TABLES.MATERIALS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const fileId = data[i][headers.indexOf('fileId')];
      try {
        DriveApp.getFileById(fileId).setTrashed(true);
      } catch (e) {
        Logger.log('Could not delete file from Drive: ' + e.message);
      }
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error('Material not found');
}

function getOrCreateSubFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
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
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const hashes = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
  const now = new Date();
  
  for (let i = 0; i < hashes.length; i++) {
    if (hashes[i][0] === hash) {
      const rowIdx = i + 2;
      const sessionData = sheet.getRange(rowIdx, 1, 1, 5).getValues()[0];
      const expiry = new Date(sessionData[3]);
      if (expiry > now) {
        return getUserById(sessionData[1]);
      }
      break;
    }
  }
  return null;
}

function getUserById(id) {
  const sheet = getSheet(TABLES.USERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('User not found');

  const idColValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let rowIdx = -1;
  for (let i = 0; i < idColValues.length; i++) {
    if (idColValues[i][0] === id) {
      rowIdx = i + 2;
      break;
    }
  }
  
  if (rowIdx === -1) throw new Error('User not found');
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = sheet.getRange(rowIdx, 1, 1, headers.length).getValues()[0];
  return rowToObject(rowData, headers);
}

function rowToObject(row, headers) {
  const obj = {};
  headers.forEach((h, i) => obj[h] = row[i]);
  return obj;
}

// --- AI Handlers ---

function SETUP_OPENROUTER_KEY(apiKey) {
  if (!apiKey) {
    Logger.log("❌ Please provide the API key as an argument: SETUP_OPENROUTER_KEY('sk-or-...')");
    return;
  }
  PropertiesService.getScriptProperties().setProperty('OPENROUTER_API_KEY', apiKey);
  Logger.log("✅ API Key saved successfully!");
}

function handleAIChat(user, payload) {
  if (!user) throw new Error('Unauthorized');
  const { messages, context } = payload;
  
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

  const response = callOpenRouter(chatHistory);
  logAction(user.id, 'AI_CHAT', `Interaction on ${context?.pageTitle || 'unknown'}`);
  
  return { content: response };
}

function handleAIExplain(user, payload) {
  if (!user) throw new Error('Unauthorized');
  const { questionContext } = payload;
  
  const prompt = `Explain this medical MCQ clearly for a student. Include why the correct answer is correct and why each incorrect option is wrong. Keep the explanation concise, accurate, and study-focused.

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
- Language: English (Always respond in English).
- Tone: Professional, academic, and clear.
- Brand: Refer to yourself as MEDEXAM AI Specialist.`;

  const response = callOpenRouter([{ role: 'user', content: prompt }]);
  logAction(user.id, 'AI_EXPLAIN', `Explained question: ${questionContext.questionText.substring(0, 30)}...`);
  
  return { content: response };
}

function callOpenRouter(messages) {
  const props = PropertiesService.getScriptProperties();
  let apiKey = props.getProperty('OPENROUTER_API_KEY');
  
  if (!apiKey) {
    return "⚠️ OpenRouter API key is missing in Apps Script Script Properties.";
  }

  apiKey = apiKey.trim();
  apiKey = apiKey.replace(/^["']|["']$/g, ''); 
  apiKey = apiKey.replace(/^Bearer\s+/i, ''); 

  if (!apiKey.startsWith('sk-or-')) {
    Logger.log('❌ Invalid Key Format: Key does not start with sk-or-');
    return "⚠️ Invalid OpenRouter API key format. Please ensure it starts with 'sk-or-'.";
  }

  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const payload = {
    model: 'openai/gpt-oss-120b:free', 
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
      'HTTP-Referer': 'https://exam-cyx.pages.dev', 
      'X-Title': 'EXAM Medical Assistant'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      Logger.log(`❌ OpenRouter Error (HTTP ${responseCode}): ${responseText}`);
      return `⚠️ AI Error (Status ${responseCode}). Please try again later.`;
    }

    const json = JSON.parse(responseText);
    if (json.choices && json.choices[0]) {
      return json.choices[0].message.content;
    } else {
      Logger.log('❌ OpenRouter Empty Choice: ' + responseText);
      return '⚠️ The AI engine returned an empty response. Please try a different query.';
    }
  } catch (e) {
    Logger.log('❌ AI Exception: ' + e.message);
    return '⚠️ Could not reach the medical brain. Please check your network connection.';
  }
}

function TEST_OPENROUTER_KEY() {
  const result = callOpenRouter([{ role: 'user', content: 'Say hello' }]);
  Logger.log('--- TEST RESULT ---');
  Logger.log(result);
  Logger.log('-------------------');
  
  if (result.startsWith('⚠️')) {
    Logger.log('❌ Test Failed. Check the error message above.');
  } else {
    Logger.log('✅ Test Successful! OpenRouter is communicating correctly.');
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

function MASTER_DATABASE_SETUP() {
  const ss = getSs();
  Object.keys(TABLES).forEach(key => {
    const name = TABLES[key];
    let sheet = ss.getSheetByName(name);
    if (sheet) {
      sheet.clear();
    } else {
      sheet = ss.insertSheet(name);
    }
    sheet.appendRow(HEADERS[name]);
    sheet.getRange(1, 1, 1, HEADERS[name].length).setFontWeight('bold').setBackground('#f3f4f6');
    sheet.setFrozenRows(1);
  });
  
  Logger.log('✅ MASTER SETUP COMPLETE. All sheets initialized with correct headers.');
}

function ULTIMATE_ADMIN_FIX() {
  const email = 'wasemkhallaf86@gmail.com';
  const username = 'waseem';
  const pass = PropertiesService.getScriptProperties().getProperty('ADMIN_TEMP_PASSWORD') || '88962334';
  
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

// --- NEW ENHANCED HANDLERS ---

function handleGetMaterialFileData(user, id) {
  const material = handleGetMaterialById(user, id);

  const targetFileId = (material.previewFileId && material.previewStatus === 'converted') ? material.previewFileId : material.fileId;
  const file = DriveApp.getFileById(targetFileId);

  if (file.getSize() > 10 * 1024 * 1024) {
    throw new Error('This file is too large for the internal viewer. Please upload a smaller file or contact an admin.');
  }

  const blob = file.getBlob();
  const mimeType = file.getMimeType() || blob.getContentType() || material.mimeType || 'application/pdf';
  const bytes = blob.getBytes();

  return {
    fileName: file.getName(),
    mimeType: mimeType,
    base64: Utilities.base64Encode(bytes),
    sizeBytes: file.getSize(),
    byteLength: bytes.length,
    type: material.type,
    title: material.title,
    isProtected: material.isProtected === 'TRUE' || material.isProtected === true,
    pdfHeaderValid: bytesStartWithPdfHeader(bytes)
  };
}

function bytesStartWithPdfHeader(bytes) {
  if (!bytes || bytes.length < 4) return false;
  return String.fromCharCode(bytes[0] & 255, bytes[1] & 255, bytes[2] & 255, bytes[3] & 255) === '%PDF';
}

function handleRepairMaterialsMetadata(user) {
  checkAdmin(user);
  const sheet = getSheet(TABLES.MATERIALS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, count: 0 };
  
  const headers = data[0];
  let repairedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const fileId = row[headers.indexOf('fileId')];
    if (!fileId) continue;

    try {
      const file = DriveApp.getFileById(fileId);
      const updates = {
        mimeType: file.getMimeType(),
        sizeBytes: file.getSize(),
        driveUrl: file.getUrl(),
        previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        updatedAt: new Date().toISOString()
      };

      const currentType = row[headers.indexOf('type')];
      if (!currentType || currentType === 'Unknown') {
        const mime = updates.mimeType;
        let newType = 'pdf';
        if (mime.includes('presentation') || mime.includes('powerpoint')) newType = 'presentation';
        else if (mime.includes('image')) newType = 'image';
        else if (mime.includes('json')) newType = 'exam';
        updates.type = newType;
      }

      Object.keys(updates).forEach(key => {
        const colIdx = headers.indexOf(key);
        if (colIdx !== -1) {
          sheet.getRange(i + 1, colIdx + 1).setValue(updates[key]);
        }
      });
      repairedCount++;
    } catch (e) {
      Logger.log(`Repair failed for row ${i+1} (${fileId}): ${e.message}`);
    }
  }

  return { success: true, count: repairedCount };
}

function handleUpdateMaterialContent(user, payload) {
  checkAdmin(user);
  const { id, content } = payload;
  const material = handleGetMaterialById(user, id);
  
  const file = DriveApp.getFileById(material.fileId);
  file.setContent(content);
  
  if (material.type === 'exam') {
    try {
      const examData = JSON.parse(content);
      const count = Array.isArray(examData.questions) ? examData.questions.length : 0;
      handleUpdateMaterialMetadata(user, { id, updates: { examQuestionCount: count } });
    } catch (e) {}
  }
  
  return { success: true };
}

function handleReplaceMaterialFile(user, payload) {
  checkAdmin(user);
  const { id, fileName, mimeType, fileBase64 } = payload;
  const material = handleGetMaterialById(user, id);
  
  try {
    DriveApp.getFileById(material.fileId).setTrashed(true);
    if (material.previewFileId) DriveApp.getFileById(material.previewFileId).setTrashed(true);
  } catch (e) {}

  const fileData = Utilities.base64Decode(fileBase64);
  const blob = Utilities.newBlob(fileData, mimeType, fileName);
  
  const oldFile = DriveApp.getFileById(material.fileId);
  const folders = oldFile.getParents();
  const folder = folders.hasNext() ? folders.next() : DriveApp.getRootFolder();
  
  const newFile = folder.createFile(blob);
  newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const newFileId = newFile.getId();
  const updates = {
    fileId: newFileId,
    originalFilename: fileName,
    mimeType: mimeType,
    sizeBytes: newFile.getSize(),
    driveUrl: newFile.getUrl(),
    previewUrl: `https://drive.google.com/file/d/${newFileId}/preview`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${newFileId}`,
    previewFileId: null,
    previewStatus: 'ready'
  };

  if (['application/vnd.openxmlformats-officedocument.presentationml.presentation', 
       'application/vnd.ms-powerpoint',
       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
       'application/msword'].includes(mimeType)) {
    try {
      const previewId = convertOfficeToPdf(newFileId, folder);
      if (previewId) {
        updates.previewFileId = previewId;
        updates.previewMimeType = 'application/pdf';
        updates.previewStatus = 'converted';
      }
    } catch (e) {
      updates.previewStatus = 'failed';
    }
  }

  handleUpdateMaterialMetadata(user, { id, updates });
  return { success: true, material: { ...material, ...updates } };
}

function handleAdminUpdateExam(user, payload) {
  checkAdmin(user);
  const { id, updates } = payload;
  const sheet = getSheet(TABLES.EXAMS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      rowIdx = i;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('Exam not found');

  updates.updated_at = new Date().toISOString();
  
  Object.keys(updates).forEach(key => {
    const colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      let val = updates[key];
      if (typeof val === 'object') val = JSON.stringify(val);
      sheet.getRange(rowIdx + 1, colIdx + 1).setValue(val);
    }
  });
  
  return { success: true };
}

function handleAdminUpdateExamJson(user, payload) {
  checkAdmin(user);
  const { id, examData } = payload;
  return handleAdminUpdateExam(user, { id, updates: { exam_data_json: JSON.stringify(examData) } });
}

function convertOfficeToPdf(fileId, targetFolder) {
  try {
    const file = DriveApp.getFileById(fileId);
    const url = "https://www.googleapis.com/drive/v3/files/" + fileId + "/export?mimeType=application/pdf";
    const token = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(url, {
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error("Export failed: " + response.getContentText());
    }
    
    const pdfBlob = response.getBlob().setName(file.getName().split('.')[0] + "_preview.pdf");
    const pdfFile = targetFolder.createFile(pdfBlob);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return pdfFile.getId();
  } catch (e) {
    Logger.log("Conversion error: " + e.message);
    return null;
  }
}

function ensureDatabaseHeaders() {
  const ss = getSs();
  Object.keys(TABLES).forEach(tableName => {
    const sheetName = TABLES[tableName];
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    const targetHeaders = HEADERS[sheetName];
    if (!targetHeaders) return;
    
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    targetHeaders.forEach((header, index) => {
      if (currentHeaders.indexOf(header) === -1) {
        const newColIdx = sheet.getLastColumn() + 1;
        sheet.insertColumnAfter(sheet.getLastColumn());
        sheet.getRange(1, newColIdx).setValue(header)
             .setFontWeight('bold')
             .setBackground('#f3f4f6');
        Logger.log('Added missing column "' + header + '" to sheet ' + sheetName);
      }
    });
  });
}