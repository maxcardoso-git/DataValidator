import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Search from './pages/Search';
import HCPValidation from './pages/HCPValidation';
import Compare from './pages/Compare';
import Upload from './pages/Upload';
import Users from './pages/Users';
import Dashboard from './pages/Dashboard';

function App() {
  const { t } = useTranslation('common');
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/search" replace /> : <Login />
        }
      />

      {/* Protected routes */}
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <Layout>
              <Search />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hcp/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <HCPValidation />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/compare"
        element={
          <ProtectedRoute>
            <Layout>
              <Compare />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/upload"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout>
              <Upload />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={<Navigate to="/search" replace />}
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900">404</h1>
              <p className="text-gray-600 mt-2">{t('notFound.message')}</p>
              <a href="/search" className="btn-primary mt-4 inline-block">
                {t('notFound.backToStart')}
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
