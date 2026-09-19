import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import NavBar from './components/NavBar';
import Landing from './pages/Landing';
import Work from './pages/Work';
import Lab from './pages/Lab';
import Entry from './pages/Entry';
import About from './pages/About';
import AdminLogin from './pages/AdminLogin';
import AdminLibrary from './pages/AdminLibrary';
import AdminUpload from './pages/AdminUpload';
import AdminEditEntry from './pages/AdminEditEntry';

function Layout() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
}

function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/work" element={<Work />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/work/:id" element={<Entry />} />
            <Route path="/lab/:id" element={<Entry />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/library"
              element={<RequireAdmin><AdminLibrary /></RequireAdmin>}
            />
            <Route
              path="/admin/upload"
              element={<RequireAdmin><AdminUpload /></RequireAdmin>}
            />
            <Route
              path="/admin/entries/:id/edit"
              element={<RequireAdmin><AdminEditEntry /></RequireAdmin>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
