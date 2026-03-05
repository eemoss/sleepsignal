import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Locations from './pages/Locations';
import Dashboard from './pages/Dashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated } = useAuth();

  const isMock = window.location.search.includes('mock=true');

  return (
    <div className="min-h-screen bg-slate-950 text-white w-full">
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/locations" />} />
        <Route path="/locations" element={isAuthenticated ? <Locations /> : <Navigate to="/login" />} />
        <Route path="/dashboard/:locationId" element={(isAuthenticated || isMock) ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/locations" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;
