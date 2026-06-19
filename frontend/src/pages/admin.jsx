import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token || user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [token, user, navigate]);

  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/withdrawals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWithdrawals(res.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user.role === "admin") fetchWithdrawals();
  }, [token, user.role]);

  const handlePayout = async (id) => {
    if (!window.confirm("Are you sure you want to send this money via M-Pesa?")) return;
    
    setProcessingId(id);
    try {
      const res = await axios.post(`http://localhost:5000/api/admin/payout/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
      fetchWithdrawals(); // Refresh the list
    } catch (error) {
      alert(error.response?.data?.message || "Payout failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this withdrawal? The user will keep their balance.")) return;
    try {
      await axios.post(`http://localhost:5000/api/admin/reject/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWithdrawals();
    } catch (error) {
      alert("Failed to reject.");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Admin Panel...</div>;

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <Navbar />
      
      <main className="container px-4 py-8 mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">Admin Control Center</h1>
        
        <div className="p-6 mb-8 bg-white border-l-4 border-red-500 shadow-sm rounded-xl">
          <h2 className="mb-2 text-lg font-bold text-red-700">Pending Withdrawals ({withdrawals.length})</h2>
          <p className="text-sm text-gray-500">Approve these requests to initiate Safaricom B2C payouts.</p>
        </div>

        <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
          {withdrawals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No pending withdrawals. You are all caught up!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-sm font-bold text-gray-600">User Details</th>
                    <th className="p-4 text-sm font-bold text-gray-600">Wallet Balance</th>
                    <th className="p-4 text-sm font-bold text-gray-600">Requested Amount</th>
                    <th className="p-4 text-sm font-bold text-right text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawals.map((req) => (
                    <tr key={req.id} className="transition hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-bold text-gray-800">{req.username}</p>
                        <p className="text-xs text-gray-500">{req.phone}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(req.created_at).toLocaleString()}</p>
                      </td>
                      <td className="p-4 font-medium text-gray-600">KES {Number(req.balance).toLocaleString()}</td>
                      <td className="p-4 font-bold text-blue-600">KES {Number(req.amount).toLocaleString()}</td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => handleReject(req.id)}
                          disabled={processingId === req.id}
                          className="px-4 py-2 text-xs font-bold text-gray-600 transition bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handlePayout(req.id)}
                          disabled={processingId === req.id}
                          className="px-4 py-2 text-xs font-bold text-white transition bg-green-500 rounded-lg shadow-sm hover:bg-green-600 disabled:opacity-50 flex items-center inline-flex"
                        >
                          {processingId === req.id ? 'Processing...' : (
                             <>
                               Approve & Pay <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" alt="M-Pesa" className="h-3 ml-2" />
                             </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;