import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard"; // <-- Import the card!

const AdminDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [overview, setOverview] = useState({ investments: [], totalInvested: 0, totalUserBalances: 0 });
  const [availableProducts, setAvailableProducts] = useState([]); // <-- Store products
  const [loading, setLoading] = useState(true);
  
  // Add Product Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", daily_profit: "", duration_days: "" });

  const token = localStorage.getItem("token");

  const fetchAdminData = async () => {
    try {
      // Fetch Transactions, Overview, AND Products all at once
      const [txRes, overviewRes, prodRes] = await Promise.all([
        axios.get("http://localhost:5000/api/admin/transactions", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/admin/overview", { headers: { Authorization: `Bearer ${token}` } }),       
        axios.get("http://localhost:5000/api/products", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setTransactions(txRes.data);
      setOverview(overviewRes.data);
      setAvailableProducts(prodRes.data);
      setLoading(false);
    } catch (error) {
      alert("Access Denied: Admins Only");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAction = async (id, action) => {
    try {
      const endpoint = action === 'approve' ? 'approve-withdrawal' : 'reject-withdrawal';
      await axios.post(`http://localhost:5000/api/admin/${endpoint}/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdminData();
    } catch (error) {
      alert("Failed to process transaction.");
    }
  };

  // Handle creating a new product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/admin/add-product", newProduct, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      setNewProduct({ name: "", price: "", daily_profit: "", duration_days: "" }); // Reset form
      fetchAdminData(); // Refresh the product list
      alert("Product added successfully! You can now hover over it to add an image.");
    } catch (error) {
      alert("Failed to add product.");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Admin Panel...</div>;

  const deposits = transactions.filter(t => t.type === 'deposit');
  const withdrawals = transactions.filter(t => t.type === 'withdraw');

  const totalDeposited = deposits.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalWithdrawn = withdrawals.filter(t => t.status === 'approved').reduce((sum, t) => sum + Number(t.amount), 0);
  const companyLiquidity = totalDeposited - totalWithdrawn;

  return (
    <div className="min-h-screen pb-20 bg-gray-100">
      <Navbar />
      
      <main className="container px-4 py-8 mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">Admin Control Center</h1>

        {/* 1. The 4 Global Metric Cards */}
        <div className="grid grid-cols-1 gap-4 mb-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white border-l-4 border-green-500 shadow-sm rounded-xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase">Total Deposits</h3>
            <p className="mt-2 text-2xl font-bold text-gray-800">KES {totalDeposited.toLocaleString()}</p>
          </div>
          <div className="p-6 bg-white border-l-4 border-red-500 shadow-sm rounded-xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase">Total Withdrawals</h3>
            <p className="mt-2 text-2xl font-bold text-gray-800">KES {totalWithdrawn.toLocaleString()}</p>
          </div>
          <div className="p-6 bg-white border-l-4 border-teal-500 shadow-sm rounded-xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase">Active Investments</h3>
            <p className="mt-2 text-2xl font-bold text-gray-800">KES {Number(overview.totalInvested).toLocaleString()}</p>
          </div>
          <div className="p-6 bg-gray-800 shadow-sm rounded-xl">
            <h3 className="text-xs font-bold text-gray-300 uppercase">Company Cash (Liquidity)</h3>
            <p className="mt-2 text-2xl font-bold text-white">KES {companyLiquidity.toLocaleString()}</p>
          </div>
        </div>

        {/* 2. Middle Row: Transactions */}
        <div className="grid grid-cols-1 gap-8 mb-10 lg:grid-cols-2">
          
          {/* Actionable Withdrawals List */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
            <h2 className="pb-2 mb-4 text-xl font-bold border-b text-gray-800">Withdrawal Requests</h2>
            <div className="space-y-4">
              {withdrawals.length === 0 ? <p className="text-gray-500">No pending withdrawals.</p> : null}
              {withdrawals.map((w) => (
                <div key={w.id} className="flex flex-col p-4 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-800">{w.username} <span className="text-xs font-normal text-gray-500">({w.email})</span></p>
                      <p className="text-sm text-gray-600">{new Date(w.created_at).toLocaleString()}</p>
                    </div>
                    <p className="text-xl font-bold text-gray-800">KES {Number(w.amount).toLocaleString()}</p>
                  </div>
                  
                  {w.status === 'pending' ? (
                    <div className="flex pt-2 mt-2 space-x-2 border-t border-gray-200">
                      <button onClick={() => handleAction(w.id, 'approve')} className="flex-1 py-2 text-sm font-bold text-white bg-green-500 rounded hover:bg-green-600">Approve</button>
                      <button onClick={() => handleAction(w.id, 'reject')} className="flex-1 py-2 text-sm font-bold text-white bg-red-500 rounded hover:bg-red-600">Reject</button>
                    </div>
                  ) : (
                    <div className={`mt-2 text-sm font-bold text-center py-1 rounded ${w.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {w.status.toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Automatic Deposits List */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
            <h2 className="pb-2 mb-4 text-xl font-bold border-b text-gray-800">Recent Deposits</h2>
            <div className="h-[400px] overflow-y-auto space-y-4 pr-2">
              {deposits.length === 0 ? <p className="text-gray-500">No deposits found.</p> : null}
              {deposits.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg">
                  <div>
                    <p className="font-bold text-gray-800">{d.username}</p>
                    <p className="text-sm text-gray-600">{new Date(d.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+ KES {Number(d.amount).toLocaleString()}</p>
                    <span className="px-2 py-1 text-xs font-bold text-green-700 bg-green-100 rounded">APPROVED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. NEW SECTION: PRODUCT MANAGEMENT */}
        <div className="p-6 mb-10 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="flex items-center justify-between pb-2 mb-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Product Management</h2>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-sm font-bold text-white bg-teal-500 rounded-lg hover:bg-teal-600 shadow-sm"
              >
                + Add New Product
              </button>
            </div>
            
            {/* Display products using the ProductCard so you can hover and "Edit Image" */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
        </div>

        {/* 4. Bottom Row: Global Active Investments */}
        <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
            <h2 className="pb-2 mb-4 text-xl font-bold border-b text-gray-800">All Running Tasks Globally</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="p-3 text-sm font-bold text-gray-600">User</th>
                    <th className="p-3 text-sm font-bold text-gray-600">Product</th>
                    <th className="p-3 text-sm font-bold text-gray-600">Amount Paid</th>
                    <th className="p-3 text-sm font-bold text-gray-600">Start Date</th>
                    <th className="p-3 text-sm font-bold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.investments.length === 0 && (
                    <tr><td colSpan="5" className="p-4 text-center text-gray-500">No active investments found.</td></tr>
                  )}
                  {overview.investments.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-bold text-gray-800">{inv.username}</p>
                        <p className="text-xs text-gray-500">{inv.email}</p>
                      </td>
                      <td className="p-3 font-medium text-gray-700">{inv.product_name}</td>
                      <td className="p-3 font-bold text-teal-600">KES {Number(inv.amount_paid).toLocaleString()}</td>
                      <td className="p-3 text-sm text-gray-600">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 text-xs font-bold text-teal-700 bg-teal-100 rounded-full">Running</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-2xl">
              <h2 className="mb-4 text-xl font-bold text-gray-800">Add New Product</h2>
              
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Name</label>
                  <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" placeholder="e.g. iPhone 15 Pro"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (KES)</label>
                  <input type="number" required value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" placeholder="e.g. 5000"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Daily Earnings (KES)</label>
                  <input type="number" required value={newProduct.daily_profit} onChange={(e) => setNewProduct({...newProduct, daily_profit: e.target.value})} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" placeholder="e.g. 250"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
                  <input type="number" required value={newProduct.duration_days} onChange={(e) => setNewProduct({...newProduct, duration_days: e.target.value})} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" placeholder="e.g. 30"/>
                </div>

                <div className="flex justify-end pt-4 space-x-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-teal-500 rounded-lg hover:bg-teal-600">Save Product</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;