import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const Referrals = () => {
  const [data, setData] = useState({ totalCommission: 0, count: 0, team: { level1: [], level2: [], level3: [] } });
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRef = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/wallet/referrals", { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch referrals");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchRef();
  }, [token]);

  const renderTeamList = (members, rate) => {
    if (members.length === 0) {
      return <div className="p-8 text-center text-gray-400">No members in this tier yet. Keep building!</div>;
    }
    return (
      <div className="divide-y divide-gray-100">
        {members.map((member, i) => (
          <div key={i} className="flex items-center justify-between p-4 transition hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 font-bold text-teal-700 bg-teal-100 rounded-full">
                {member.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="block font-bold text-gray-800 capitalize">{member.username}</span>
                <span className="text-xs text-gray-500">Joined {new Date(member.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right">
               <span className="px-2 py-1 text-xs font-bold text-green-700 bg-green-100 rounded">+{rate}% Comm.</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center">Loading your empire...</div>;

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <Navbar />
      <main className="container px-4 py-8 mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">Agent Commissions</h1>
        
        {/* Referral Code Box */}
        <div className="relative p-6 mb-8 text-center bg-white shadow-sm border-x-4 border-y border-teal-500 border-y-gray-100 rounded-xl overflow-hidden">
          <p className="mb-2 text-sm font-bold tracking-widest text-gray-500 uppercase">My Referral Code</p>
          <div className="text-4xl font-black text-teal-600 tracking-[0.2em] mb-4">{user.referral_code}</div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(user.referral_code);
              alert("Referral code copied to clipboard!");
            }} 
            className="px-6 py-2 font-bold text-white transition bg-teal-500 rounded-lg shadow-sm hover:bg-teal-600"
          >
            Copy Code
          </button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <p className="text-sm font-medium text-gray-500">Total Commissions</p>
            <p className="mt-1 text-2xl font-black text-gray-800">KES {Number(data.totalCommission).toLocaleString()}</p>
          </div>
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <p className="text-sm font-medium text-gray-500">Total Team Size</p>
            <p className="mt-1 text-2xl font-black text-teal-600">{data.count} <span className="text-sm font-medium text-gray-400">members</span></p>
          </div>
        </div>

        {/* The 3-Tier Team Viewer */}
        <h3 className="mb-4 text-lg font-bold text-gray-800">My Network</h3>
        <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
          
          {/* Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            <button 
              onClick={() => setActiveTab(1)}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 1 ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tier 1 ({data.team.level1.length})
            </button>
            <button 
              onClick={() => setActiveTab(2)}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 2 ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tier 2 ({data.team.level2.length})
            </button>
            <button 
              onClick={() => setActiveTab(3)}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 3 ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tier 3 ({data.team.level3.length})
            </button>
          </div>

          {/* List Content */}
          <div className="bg-white">
            {activeTab === 1 && renderTeamList(data.team.level1, 8)}
            {activeTab === 2 && renderTeamList(data.team.level2, 4)}
            {activeTab === 3 && renderTeamList(data.team.level3, 2)}
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default Referrals;