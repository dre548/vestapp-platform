import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom"; // 1. Added the import!

const ClaimEarnings = () => {
  const navigate = useNavigate(); // 2. Defined it right here!
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // 3. Bulletproof Security Check
  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
      return;
    }
    if (user.role === "admin") {
      navigate("/admin");
    }
  }, [user, navigate, token]);

  const fetchInvestments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvestments(res.data.investments);
      setLoading(false);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (token) fetchInvestments(); 
  }, [token]);

  const handleClaim = async (investId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/investments/claim/${investId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
      fetchInvestments(); // Refresh timer
    } catch (error) {
      alert(error.response?.data?.message || "Claim failed.");
    }
  };

  const getClaimStatus = (lastClaimed) => {
    const msPassed = Date.now() - new Date(lastClaimed).getTime();
    const hoursPassed = msPassed / (1000 * 60 * 60);
    if (hoursPassed >= 24) return { ready: true, text: "Claim Now" };
    
    const hoursLeft = Math.floor(24 - hoursPassed);
    const minsLeft = Math.floor(((24 - hoursPassed) * 60) % 60);
    return { ready: false, text: `Wait ${hoursLeft}h ${minsLeft}m` };
  };

  if (loading) return <div className="p-10 text-center">Loading your tasks...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <main className="container px-4 py-8 mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">My Running Tasks</h1>
        
        {investments.length === 0 ? (
          <div className="p-10 text-center bg-white border border-gray-200 border-dashed rounded-xl">
            <p className="text-gray-500">You have no active products. Buy a device to start earning!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {investments.map((inv) => (
              <div key={inv.id} className="p-5 bg-white border-l-4 border-green-500 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center">
                <div className="w-full sm:w-auto mb-4 sm:mb-0">
                  <h3 className="text-lg font-bold text-gray-800">{inv.name}</h3>
                  <p className="text-sm text-gray-500">Task ID: #{inv.id}84729</p>
                  <p className="text-sm text-gray-500 mt-1">Purchased: {new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                
                <div className="w-full sm:w-auto flex flex-col items-center bg-green-50 px-6 py-3 rounded-lg border border-green-100">
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">Daily Profit</p>
                  <p className="text-xl font-bold text-green-700 mb-3">KES {Number(inv.daily_profit).toLocaleString()}</p>
                  
                  {getClaimStatus(inv.last_claimed).ready ? (
                     <button onClick={() => handleClaim(inv.id)} className="w-full px-6 py-2 text-sm font-bold text-white bg-green-500 rounded-full hover:bg-green-600 shadow-sm animate-pulse">
                       {getClaimStatus(inv.last_claimed).text}
                     </button>
                  ) : (
                     <button disabled className="w-full px-4 py-2 text-sm font-bold text-gray-500 bg-gray-200 rounded-full cursor-not-allowed">
                       {getClaimStatus(inv.last_claimed).text}
                     </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClaimEarnings;