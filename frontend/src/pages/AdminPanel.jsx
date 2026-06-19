import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("overview"); // overview, products, withdrawals
  
  // States
  const [stats, setStats] = useState({ investments: [], totalInvested: 0, totalUserBalances: 0 });
  const [products, setProducts] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  
  const [newProduct, setNewProduct] = useState({ name: "", price: "", daily_profit: "", duration_days: "" });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  
  // Grab the API URL from your .env file
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch Data Hub
  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, prodRes, withRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/overview`, { headers }),
        axios.get(`${API_URL}/api/investments/products`, { headers }), 
        axios.get(`${API_URL}/api/admin/withdrawals`, { headers })
      ]);

      setStats(statsRes.data);
      setProducts(prodRes.data);
      setWithdrawals(withRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data.");
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate("/dashboard"); // Kick out non-admins
      }
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token, navigate]);

  // ==========================================
  // PRODUCT MANAGEMENT
  // ==========================================
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/admin/products`, newProduct, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ " + res.data.message);
      setNewProduct({ name: "", price: "", daily_profit: "", duration_days: "" });
      fetchData(); 
    } catch (error) {
      alert("❌ " + (error.response?.data?.message || "Failed to add product."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await axios.delete(`${API_URL}/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ " + res.data.message);
      fetchData();
    } catch (error) {
      alert("❌ Failed to delete product.");
    }
  };

  // ==========================================
  // WITHDRAWAL CONTROLS
  // ==========================================
  const handlePayout = async (txId, amount, phone) => {
    if (!window.confirm(`Send KES ${amount} to ${phone} via M-Pesa B2C?`)) return;
    setActionLoading(txId);
    try {
      const res = await axios.post(`${API_URL}/api/admin/payout/${txId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ " + res.data.message);
      fetchData();
    } catch (error) {
      alert("❌ " + (error.response?.data?.message || "Payout failed."));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (txId) => {
    if (!window.confirm("Reject this withdrawal and refund the user?")) return;
    setActionLoading(txId);
    try {
      const res = await axios.post(`${API_URL}/api/admin/reject/${txId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("⚠️ " + res.data.message);
      fetchData();
    } catch (error) {
      alert("❌ " + (error.response?.data?.message || "Rejection failed."));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <Navbar />
      
      <main className="container px-4 py-8 mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-black text-gray-800">Admin Control Center</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-8 space-x-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <button onClick={() => setActiveTab("overview")} className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-teal-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
            Global Overview
          </button>
          <button onClick={() => setActiveTab("products")} className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-teal-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
            Product Management
          </button>
          <button onClick={() => setActiveTab("withdrawals")} className={`flex items-center px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'withdrawals' ? 'bg-teal-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
            Pending Withdrawals
            {withdrawals.length > 0 && (
              <span className="flex items-center justify-center w-5 h-5 ml-2 text-xs text-white bg-red-500 rounded-full">{withdrawals.length}</span>
            )}
          </button>
        </div>

        {/* --------------------------------------------------- */}
        {/* TAB 1: GLOBAL OVERVIEW                              */}
        {/* --------------------------------------------------- */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Active Investments</p>
                <h3 className="text-4xl font-black text-teal-600">KES {Number(stats.totalInvested).toLocaleString()}</h3>
              </div>
              <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">User Wallet Liabilities</p>
                <h3 className="text-4xl font-black text-orange-500">KES {Number(stats.totalUserBalances).toLocaleString()}</h3>
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <h2 className="mb-4 text-xl font-bold text-gray-800">Recent Platform Investments</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase border-b border-gray-100 bg-gray-50">
                      <th className="p-3 font-bold rounded-tl-lg">User</th>
                      <th className="p-3 font-bold">Product</th>
                      <th className="p-3 font-bold">Amount</th>
                      <th className="p-3 font-bold rounded-tr-lg text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.investments.length === 0 ? (
                      <tr><td colSpan="4" className="py-6 text-center text-gray-500">No active investments yet.</td></tr>
                    ) : (
                      stats.investments.map(inv => (
                        <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="p-3 font-bold text-gray-800">{inv.username}</td>
                          <td className="p-3 text-gray-600 font-medium">{inv.product_name}</td>
                          <td className="p-3 text-teal-600 font-black">KES {inv.amount_paid}</td>
                          <td className="p-3 text-sm text-gray-500 text-right">{new Date(inv.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------- */}
        {/* TAB 2: PRODUCT MANAGEMENT                           */}
        {/* --------------------------------------------------- */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <h2 className="mb-4 text-xl font-bold text-gray-800">Create New Product</h2>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">Device Name</label>
                  <input type="text" name="name" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Starter Pack" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">Price (KES)</label>
                  <input type="number" name="price" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="1000" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">Daily Profit</label>
                  <input type="number" name="daily_profit" value={newProduct.daily_profit} onChange={(e) => setNewProduct({...newProduct, daily_profit: e.target.value})} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="100" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">Duration (Days)</label>
                  <div className="flex space-x-2">
                    <input type="number" name="duration_days" value={newProduct.duration_days} onChange={(e) => setNewProduct({...newProduct, duration_days: e.target.value})} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="30" />
                    <button type="submit" disabled={loading} className="px-6 py-2 font-bold text-white bg-teal-500 rounded-xl hover:bg-teal-600 disabled:opacity-70 whitespace-nowrap">
                      {loading ? "..." : "Add"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map(product => (
                <div key={product.id} className="relative p-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
                  <button onClick={() => handleDeleteProduct(product.id)} className="absolute top-4 right-4 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded hover:bg-red-100">Delete</button>
                  <h3 className="text-lg font-black text-gray-800 mb-2">{product.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Price:</span> <span className="font-bold">KES {product.price}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Daily Profit:</span> <span className="font-bold text-green-500">KES {product.daily_profit}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Duration:</span> <span className="font-bold">{product.duration_days} Days</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------- */}
        {/* TAB 3: PENDING WITHDRAWALS                          */}
        {/* --------------------------------------------------- */}
        {activeTab === "withdrawals" && (
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <h2 className="mb-4 text-xl font-bold text-gray-800">Action Center</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase border-b border-gray-100 bg-gray-50">
                    <th className="p-3 font-bold rounded-tl-lg">User</th>
                    <th className="p-3 font-bold">M-Pesa Phone</th>
                    <th className="p-3 font-bold">Amount</th>
                    <th className="p-3 font-bold">Date Requested</th>
                    <th className="p-3 font-bold rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.length === 0 ? (
                    <tr><td colSpan="5" className="py-10 text-center text-gray-500 font-medium">No pending withdrawal requests.</td></tr>
                  ) : (
                    withdrawals.map(req => (
                      <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-800">{req.username}</td>
                        <td className="p-3 text-gray-600 font-medium">{req.phone}</td>
                        <td className="p-3 text-red-500 font-black">KES {req.amount}</td>
                        <td className="p-3 text-sm text-gray-500">{new Date(req.created_at).toLocaleString()}</td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <button 
                            onClick={() => handleReject(req.id)}
                            disabled={actionLoading === req.id}
                            className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                          >
                            Reject & Refund
                          </button>
                          <button 
                            onClick={() => handlePayout(req.id, req.amount, req.phone)}
                            disabled={actionLoading === req.id}
                            className="px-4 py-2 text-xs font-bold text-white bg-green-500 rounded-lg shadow-sm hover:bg-green-600 disabled:opacity-50"
                          >
                            {actionLoading === req.id ? 'Processing...' : 'Approve & Pay'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminPanel;