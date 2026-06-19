import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; 

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const isActive = (path) => location.pathname === path;

  // 1. Get user data securely from local storage
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    // 2. Clear everything and redirect
    localStorage.clear();
    setIsOpen(false);
    navigate("/login");
  };

  // 3. Hide the Navbar entirely on Login/Register pages for a cleaner look
  const isAuthPage = ['/login', '/register', '/verify', '/forgot-password'].includes(location.pathname);
  if (isAuthPage) return null;

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <button 
          onClick={toggleSidebar} 
          className="p-2 text-gray-600 transition-colors bg-gray-50 rounded-xl hover:bg-teal-50 hover:text-teal-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        {/* Center Logo */}
        <div className="flex items-center justify-center">
          <Link to="/dashboard">
            <img src={logo} alt="VestApp Logo" className="object-contain h-8" />
          </Link>
        </div>

        {/* Right side placeholder to keep logo perfectly centered */}
        <div className="w-10"></div> 
      </nav>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 transition-opacity bg-black/50 backdrop-blur-sm"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Slide-out Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <img src={logo} alt="VestApp Logo" className="object-contain h-8" />
          <button onClick={toggleSidebar} className="text-gray-400 hover:text-red-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Sidebar Links */}
        <div className="flex flex-col flex-grow px-4 py-6 space-y-2 overflow-y-auto">
          
          {token && (
            <>
              <Link 
                to="/dashboard" 
                onClick={toggleSidebar} 
                className={`flex items-center px-4 py-3 rounded-xl transition-colors ${isActive('/dashboard') ? 'bg-teal-100 text-teal-700 font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                Dashboard
              </Link>

              <Link 
                to="/my-devices" 
                onClick={toggleSidebar} 
                className={`flex items-center px-4 py-3 rounded-xl transition-colors ${isActive('/my-devices') ? 'bg-teal-100 text-teal-700 font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                My Devices
              </Link>

              <Link 
                to="/wallet" 
                onClick={toggleSidebar} 
                className={`flex items-center px-4 py-3 rounded-xl transition-colors ${isActive('/wallet') ? 'bg-teal-100 text-teal-700 font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                Wallet
              </Link>

              <Link 
                to="/referrals" 
                onClick={toggleSidebar} 
                className={`flex items-center px-4 py-3 rounded-xl transition-colors ${isActive('/referrals') ? 'bg-teal-100 text-teal-700 font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                My Team
              </Link>

              {/* 4. The Magic Admin Link! Only shows if role === "admin" */}
              {isAdmin && (
                <div className="pt-4 mt-2 border-t border-gray-100">
                  <Link 
                    to="/admin" 
                    onClick={toggleSidebar} 
                    className={`flex items-center px-4 py-3 rounded-xl transition-colors ${isActive('/admin') ? 'bg-red-100 text-red-700 font-bold border border-red-200' : 'text-red-600 hover:bg-red-50 font-bold'}`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    Admin Panel
                  </Link>
                </div>
              )}
            </>
          )}

        </div>

        {/* Logout Button at Bottom */}
        {token && (
          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-3 font-bold text-gray-600 transition-colors bg-gray-50 rounded-xl hover:bg-red-50 hover:text-red-600"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Log Out
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;