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

const AppContent = () => {
  const { vault, isLoading } = useVault();

  if (isLoading) {
    return <div className="loading-screen">Loading encrypted vault...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={vault ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={vault ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      
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
