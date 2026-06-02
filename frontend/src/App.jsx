import React, {useState} from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes({ jobDescription, setJobDescription }) {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
            />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  const [jobDescription, setJobDescription] = useState(null);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}