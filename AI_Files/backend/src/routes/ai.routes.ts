
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { AIController } from '../controllers/ai.controller';
import { Role } from '@prisma/client';

const router = Router();

// --- Student & General AI Endpoints ---

// Analyze student performance (Self or Admin)
router.post('/analyze/student/:userId', authenticate, AIController.analyzeStudent);

// Get specific recommendations (Self or Admin)
router.post('/recommend/student/:userId', authenticate, AIController.getRecommendations);

// --- Admin Only AI Endpoints ---

// Analyze specific exam quality
router.post('/analyze/exam/:examId', authenticate, requireRole(Role.TEACHER_ADMIN, Role.SUPER_ADMIN), AIController.analyzeExam);

// Full cohort intelligence
router.post('/analyze/cohort', authenticate, requireRole(Role.TEACHER_ADMIN, Role.SUPER_ADMIN), AIController.analyzeCohort);

// Admin-level strategic summary
router.post('/admin/summary', authenticate, requireRole(Role.TEACHER_ADMIN, Role.SUPER_ADMIN), AIController.getAdminSummary);

// Student Mentor Chat
router.post('/chat/stream', authenticate, AIController.streamChat);
router.post('/chat', authenticate, AIController.handleChat);

export default router;
