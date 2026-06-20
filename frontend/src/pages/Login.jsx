import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/Logo.png";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Grab the API URL from your .env file
  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);

    try {
      // Replaced hardcoded localhost with the dynamic API_URL
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);
      
      // Save auth data to local storage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Route based on role
      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        navigate("/verify", { state: { phone: err.response.data.phone } });
      } else {
        setMessage({ text: err.response?.data?.message || "Login failed.", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-10 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white border border-gray-100 shadow-lg rounded-2xl">
        
        {/* BRANDING LOGO */}
        <div className="flex justify-center mb-6">
          <img 
            src={logo} 
            alt="VestApp Logo" 
            className="object-contain h-16" 
          />
        </div>

        <h2 className="mb-2 text-2xl font-black text-center text-gray-800">Welcome Back</h2>
        <p className="mb-8 text-sm font-medium text-center text-gray-500">Log in to manage your investments.</p>
        
        {message.text && (
          <div className={`p-3 mb-6 text-sm font-bold rounded-xl ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700">Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="w-full px-4 py-3 font-medium text-gray-800 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
              placeholder="you@example.com" 
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-bold text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-bold text-teal-600 cursor-pointer hover:underline">
                Forgot password?
              </Link>
            </div>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
              className="w-full px-4 py-3 font-medium text-gray-800 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3.5 mt-2 font-bold text-white transition-all bg-teal-500 rounded-xl shadow-md hover:bg-teal-600 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Log In"}
          </button>
        </form>
        
        <p className="mt-8 text-sm font-medium text-center text-gray-500">
          Don't have an account yet? <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700 hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;