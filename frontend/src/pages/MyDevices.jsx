import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const MyDevices = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchDevices = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/investments/my-investments", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDevices(res.data);
      } catch (error) {
        console.error("Failed to fetch devices");
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [token, navigate]);

  const handleClaim = async (id) => {
    setProcessingId(id);
    try {
      const res = await axios.post(`http://localhost:5000/api/investments/claim/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("🎉 " + res.data.message);
      
      // Update the last_claimed time locally so the button disables immediately
      setDevices(devices.map(dev => 
        dev.id === id ? { ...dev, last_claimed: new Date().toISOString() } : dev
      ));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to claim earnings.");
    } finally {
      setProcessingId(null);
    }
  };

  // Helper function to check if 24 hours have passed
  const canClaim = (lastClaimedDate) => {
    const lastClaimed = new Date(lastClaimedDate).getTime();
    const now = Date.now();
    const hoursPassed = (now - lastClaimed) / (1000 * 60 * 60);
    return hoursPassed >= 24;
  };

  if (loading) return <div className="p-10 text-center">Loading your devices...</div>;

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <Navbar />
      
      <main className="container px-4 py-8 mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">My Devices</h1>
        <p className="mb-8 text-sm text-gray-500">Claim your daily profits every 24 hours.</p>
        
        <div className="flex flex-col space-y-4">
          {devices.length === 0 ? (
            <div className="p-8 text-center bg-white border border-gray-100 rounded-2xl shadow-sm">
              <p className="text-gray-500 font-medium mb-4">You don't own any devices yet.</p>
              <button onClick={() => navigate("/dashboard")} className="px-6 py-2 text-sm font-bold text-white bg-teal-500 rounded-lg hover:bg-teal-600">
                Go to Product Center
              </button>
            </div>
          ) : (
            devices.map((device) => {
              const isReady = canClaim(device.last_claimed);
              
              return (
                <div key={device.id} className="relative p-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12 bg-teal-100 text-teal-600 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900">{device.name}</h3>
                        <p className="text-xs text-gray-500">Purchased: {new Date(device.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Daily Profit</p>
                      <p className="text-lg font-black text-green-500">KES {Number(device.daily_profit).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <button 
                      onClick={() => handleClaim(device.id)}
                      disabled={!isReady || processingId === device.id}
                      className={`w-full py-3 font-bold text-white transition-all rounded-xl shadow-sm tracking-wide ${
                        isReady 
                          ? 'bg-teal-500 hover:bg-teal-600' 
                          : 'bg-gray-300 cursor-not-allowed opacity-70'
                      }`}
                    >
                      {processingId === device.id ? 'Processing...' : isReady ? 'Claim Daily Profit' : 'Check Back Tomorrow'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default MyDevices;