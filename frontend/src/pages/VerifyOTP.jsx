import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Grab the phone number passed from the Register page
  const location = useLocation();
  const phone = location.state?.phone || "";

  if (!phone) {
    // If they magically landed here without registering, send them back
    navigate("/register");
    return null;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", { phone, otp });
      setMessage({ text: res.data.message, type: "success" });
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Verification failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-10">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md border border-gray-100 text-center">
        <div className="mx-auto bg-teal-100 text-teal-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
        </div>
        
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Verify Your Number</h2>
        <p className="mb-6 text-sm text-gray-500">We sent a 6-digit code to <span className="font-bold text-gray-800">{phone}</span></p>
        
        {message.text && (
          <div className={`p-3 mb-4 text-sm font-medium rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input 
              type="text" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              maxLength="6"
              required 
              className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" 
              placeholder="••••••" 
            />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 mt-4 font-bold text-white transition bg-teal-500 rounded-lg hover:bg-teal-600 shadow-sm disabled:bg-teal-300">
            {loading ? "Verifying..." : "Verify Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;