import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { VaultProvider, useVault } from './context/VaultContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import GenerateExam from './components/GenerateExam';
import MyExams from './components/MyExams';
import ResultsHistory from './components/ResultsHistory';
import ReviewAttempt from './components/ReviewAttempt';
import ExamRunner from './components/ExamRunner';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';
import CurriculumOverview from './components/CurriculumOverview';
import YearView from './components/YearView';
import SubjectDetails from './components/SubjectDetails';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import AdminUsers from './components/AdminUsers';
import AdminExams from './components/AdminExams';
import AdminAttempts from './components/AdminAttempts';
import { AdminAnalytics, AdminSettings } from './components/AdminPlaceholders';

const AppContent = () => {
  const { user, isLoading } = useVault();

  if (isLoading) {
    return <div className="loading-screen">Initializing MEDEXAM Core...</div>;
  }

  const isAuthenticated = !!user;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
        <Route index element={<CurriculumOverview />} />
        <Route path="curriculum" element={<CurriculumOverview />} />
        <Route path="year/:yearId" element={<YearView />} />
        <Route path="subject/:yearId/:semesterId/:subjectName" element={<SubjectDetails />} />
        <Route path="exam/:type/:id" element={<ExamRunner />} />
        <Route path="generate" element={<GenerateExam />} />
        <Route path="my-exams" element={<MyExams />} />
        <Route path="history" element={<ResultsHistory />} />
        <Route path="review/:attemptId" element={<ReviewAttempt />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="exams" element={<AdminExams />} />
        <Route path="attempts" element={<AdminAttempts />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <VaultProvider>
      <AppContent />
    </VaultProvider>
  );
}

export default App;
