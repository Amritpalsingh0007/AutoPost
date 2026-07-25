
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { LogIn } from './pages/LogIn';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { RepoDetail } from './pages/RepoDetail';
import { DraftReview } from './pages/DraftReview';
import { History } from './pages/History';
import { Notes } from './pages/Notes';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/repos/:id" element={<RepoDetail />} />
            <Route path="/drafts/:id" element={<DraftReview />} />
            <Route path="/history" element={<History />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
