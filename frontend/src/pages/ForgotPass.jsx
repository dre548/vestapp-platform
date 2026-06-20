import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/Logo.png";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // Step 1: Request OTP | Step 2: Reset Password
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // STEP 1: Request the OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/forgot-password", { phone });
      setMessage({ text: res.data.message, type: "success" });
      
      // CHEAT CODE: Alert the OTP directly!
      if (res.data.devOtp) {
        alert(`DEVELOPER MODE\n\nYour Password Reset OTP is: ${res.data.devOtp}`);
      }
      
      setStep(2); // Move to password reset form
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Failed to send OTP.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP and Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/reset-password", { 
        phone, 
        otp, 
        newPassword 
      });
      
      setMessage({ text: "Success! " + res.data.message, type: "success" });
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Invalid OTP.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-10 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white border border-gray-100 shadow-lg rounded-2xl">
        
        <div className="flex justify-center mb-6">
          <img src={logo} alt="VestApp Logo" className="object-contain h-16" />
        </div>

        <h2 className="mb-2 text-2xl font-black text-center text-gray-800">Reset Password</h2>
        <p className="mb-8 text-sm font-medium text-center text-gray-500">
          {step === 1 ? "Enter your phone number to receive a recovery code." : "Enter the code sent to your phone and your new password."}
        </p>
        
        {message.text && (
          <div className={`p-3 mb-6 text-sm font-bold rounded-xl ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {message.text}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700">Registered Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-3 font-medium text-gray-800 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="07XX XXX XXX" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 font-bold text-white transition-all bg-teal-500 rounded-xl shadow-md hover:bg-teal-600 disabled:opacity-70">
              {loading ? "Sending..." : "Send Recovery Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700">6-Digit OTP</label>
              <input type="text" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} required className="w-full px-4 py-3 text-2xl font-black tracking-widest text-center text-teal-600 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 bg-gray-50" placeholder="••••••" />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full px-4 py-3 font-medium text-gray-800 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 font-bold text-white transition-all bg-teal-500 rounded-xl shadow-md hover:bg-teal-600 disabled:opacity-70">
              {loading ? "Resetting..." : "Confirm New Password"}
            </button>
          </form>
        )}
        
        <p className="mt-8 text-sm font-medium text-center text-gray-500">
          Remembered it? <Link to="/login" className="font-bold text-teal-600 hover:text-teal-700 hover:underline">Log in here</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;