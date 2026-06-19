import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import your global components
import Navbar from "./components/Navbar";

// Import all your pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import Dashboard from "./pages/Dashboard";
import MyDevices from "./pages/MyDevices";
import Wallet from "./pages/Wallet";
import Referrals from "./pages/Referrals";
import ClaimEarnings from "./pages/ClaimEarnings";
import AdminPanel from "./pages/AdminPanel";
import ForgotPassword from './pages/ForgotPass';

function App() {
  return (
    <Router>
      {/* Navbar sits outside Routes so it stays glued to the top of every page */}
      <Navbar />
      
      <Routes>
        {/* Auth Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* User Pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/earnings" element={<ClaimEarnings />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/my-devices" element={<MyDevices />} />
        
        {/* Admin Command Center */}
        <Route path="/admin" element={<AdminPanel />} />
        
        {/* Default Route: Send visitors straight to the Login page */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* THE SAFETY NET: Catch broken links and send them to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;