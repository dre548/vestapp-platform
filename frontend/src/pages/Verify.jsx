import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";

const Verify = () => {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Catch the phone number passed from the Register page
  const phone = location.state?.phone || "";

  useEffect(() => {
    if (!phone) {
      navigate("/register"); // Send them back if they try to visit this page randomly
    }
  }, [phone, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", { 
        phone, 
        otp 
      });
      
      setMessage({ text: "Success! " + res.data.message, type: "success" });
      
      // Send them to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Verification failed. Invalid code.", type: "error" });
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

        <h2 className="mb-2 text-2xl font-black text-center text-gray-800">Verify Your Phone</h2>
        <p className="mb-8 text-sm font-medium text-center text-gray-500">
          We sent a 6-digit code to <span className="font-bold text-gray-800">{phone}</span>
        </p>
        
        {message.text && (
          <div className={`p-3 mb-6 text-sm font-bold rounded-xl ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700 text-center">Enter 6-Digit OTP</label>
            <input 
              type="text" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              required 
              maxLength="6"
              className="w-full px-4 py-4 text-3xl font-black tracking-[0.5em] text-center text-teal-600 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50" 
              placeholder="••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || otp.length < 6} 
            className="w-full py-3.5 mt-2 font-bold text-white transition-all bg-teal-500 rounded-xl shadow-md hover:bg-teal-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Confirm Account"}
          </button>
        </form>
        
        <p className="mt-8 text-sm font-medium text-center text-gray-500">
          Didn't receive it? <button className="font-bold text-teal-600 hover:text-teal-700 hover:underline">Resend Code</button>
        </p>
      </div>
    </div>
  );
};

export default Verify;