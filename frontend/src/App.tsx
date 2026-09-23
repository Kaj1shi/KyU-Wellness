import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AccountLayout from './layouts/AccountLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ResourcesPage from './pages/ResourcesPage';
import PrivacyPage from './pages/PrivacyPage';
import EmergencyPage from './pages/EmergencyPage';
import DashboardPage from './pages/DashboardPage';
import CheckinHistoryPage from './pages/CheckinHistoryPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import GuestPage from './pages/auth/GuestPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import AssessmentsPage from './pages/assessments/AssessmentsPage';
import AssessmentTakePage from './pages/assessments/AssessmentTakePage';
import AssessmentResultsPage, {
  AssessmentResultDetailPage,
} from './pages/assessments/AssessmentResultsPage';
import ChatPage from './pages/chat/ChatPage';
import JournalPage from './pages/JournalPage';
import FeedbackPage from './pages/FeedbackPage';
import AppointmentsPage from './pages/AppointmentsPage';
import CounselorAlertsPage from './pages/counselor/CounselorAlertsPage';
import CounselorDashboardPage from './pages/counselor/CounselorDashboardPage';
import CounselorStudentsPage from './pages/counselor/CounselorStudentsPage';
import CounselorStudentDetailPage from './pages/counselor/CounselorStudentDetailPage';
import CounselorAppointmentsPage from './pages/counselor/CounselorAppointmentsPage';
import CounselorFeedbackPage from './pages/counselor/CounselorFeedbackPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / marketing shell (includes site footer) */}
          <Route element={<MainLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="emergency" element={<EmergencyPage />} />

            <Route path="auth/login" element={<LoginPage />} />
            <Route path="auth/register" element={<RegisterPage />} />
            <Route path="auth/guest" element={<GuestPage />} />
            <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="auth/verify-email" element={<VerifyEmailPage />} />
          </Route>

          {/* App shell (sidebar only — no marketing footer under the sidebar) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AccountLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="checkins" element={<CheckinHistoryPage />} />
              <Route path="assessments" element={<AssessmentsPage />} />
              <Route path="assessments/results" element={<AssessmentResultsPage />} />
              <Route path="assessments/results/:id" element={<AssessmentResultDetailPage />} />
              <Route path="assessments/:type" element={<AssessmentTakePage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="journal" element={<JournalPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route element={<ProtectedRoute allowedRoles={['counselor', 'admin']} />}>
                <Route path="counselor" element={<Navigate to="/counselor/dashboard" replace />} />
                <Route path="counselor/dashboard" element={<CounselorDashboardPage />} />
                <Route path="counselor/alerts" element={<CounselorAlertsPage />} />
                <Route path="counselor/students" element={<CounselorStudentsPage />} />
                <Route path="counselor/students/:id" element={<CounselorStudentDetailPage />} />
                <Route path="counselor/appointments" element={<CounselorAppointmentsPage />} />
                <Route path="counselor/feedback" element={<CounselorFeedbackPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
