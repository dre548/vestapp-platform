import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/Logo.png";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    sponsorCode: "" 
  });
  
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Grab the API URL from your .env file
  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match!", type: "error" });
      return;
    }

    setLoading(true);
    try {
      // FIX 1 & 2: Hit the 'register' route and pass the entire formData object
      const res = await axios.post(`${API_URL}/api/auth/register`, formData);

      setMessage({ text: res.data.message, type: "success" });
      
      // ==========================================
      // DEVELOPER CHEAT CODE: ALERT THE OTP!
      // ==========================================
      if (res.data.devOtp) {
        alert(`DEVELOPER MODE\n\nYour OTP is: ${res.data.devOtp}`);
      }
      
      setTimeout(() => {
        navigate("/verify", { state: { phone: formData.phone } });
      }, 1000);

    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Registration failed.", type: "error" });
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

        <h2 className="mb-2 text-2xl font-black text-center text-gray-800">Create an Account</h2>
        <p className="mb-8 text-sm font-medium text-center text-gray-500">Start earning daily profits today.</p>
        
        {message.text && (
          <div className={`p-3 mb-6 text-sm font-bold rounded-xl ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-bold text-gray-700">Full Name</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full px-4 py-3 font-medium text-gray-800 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="John Doe" />
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-bold text-gray-700">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 font-medium text-gray-800 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="you@example.com" />
          </div>

          <div>
            <label className="block mb-1 text-sm font-bold text-gray-700">M-Pesa Phone Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-3 font-medium text-gray-800 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="07XX XXX XXX" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-bold text-gray-700">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-3 font-medium text-gray-800 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="••••••••" />
            </div>
            <div>
              <label className="block mb-1 text-sm font-bold text-gray-700">Confirm</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-3 font-medium text-gray-800 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="••••••••" />
            </div>
          </div>

          <div className="pt-2">
            <label className="block mb-1 text-sm font-bold text-gray-700">Referral Code <span className="font-medium text-gray-400">(Optional)</span></label>
            <input 
              type="text" 
              name="sponsorCode" 
              value={formData.sponsorCode} 
              onChange={handleChange} 
              className="w-full px-4 py-3 font-black tracking-widest text-teal-700 uppercase transition-all bg-teal-50 border border-teal-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
              placeholder="e.g. X9A2B" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3.5 mt-4 font-bold text-white transition-all bg-teal-500 rounded-xl shadow-md hover:bg-teal-600 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Register Now"}
          </button>
        </form>
        
        <p className="mt-8 text-sm font-medium text-center text-gray-500">
          Already have an account? <Link to="/login" className="font-bold text-teal-600 hover:text-teal-700 hover:underline">Log in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;