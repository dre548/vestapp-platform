import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ balance: 0, todayEarnings: 0, deposits: 0, withdrawals: 0 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    
    const fetchDashboardData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch products, balance, and transaction history simultaneously
        const [prodRes, balRes, txRes] = await Promise.all([
          axios.get("http://localhost:5000/api/investments/products", { headers }),
          axios.get("http://localhost:5000/api/wallet/balance", { headers }),
          axios.get("http://localhost:5000/api/wallet/transactions", { headers })
        ]);

        setProducts(prodRes.data);

        // Calculate live statistics from transaction history
        const txs = txRes.data;
        const todayStr = new Date().toDateString();

        const todayEarn = txs
          .filter(tx => tx.type === 'earning' && new Date(tx.created_at).toDateString() === todayStr)
          .reduce((sum, tx) => sum + Number(tx.amount), 0);

        const totDep = txs
          .filter(tx => tx.type === 'deposit' && tx.status === 'approved')
          .reduce((sum, tx) => sum + Number(tx.amount), 0);

        const totWith = txs
          .filter(tx => tx.type === 'withdraw' && tx.status === 'approved')
          .reduce((sum, tx) => sum + Number(tx.amount), 0);

        setStats({
          balance: balRes.data.balance,
          todayEarnings: todayEarn,
          deposits: totDep,
          withdrawals: totWith
        });

      } catch (error) {
        console.error("Dashboard fetch error:", error);
        if (error.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [token, navigate]);

  const handleBuy = async (product) => {
    if (!window.confirm(`Buy ${product.name} for KSH ${product.price}?`)) return;
    
    setProcessingId(product.id);
    try {
      const res = await axios.post("http://localhost:5000/api/investments/buy", 
        { productId: product.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Success! " + res.data.message);
      window.location.reload(); // Quick reload to update wallet stats
    } catch (error) {
      alert(error.response?.data?.message || "Failed to purchase product.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/product/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      alert("Failed to delete product.");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <Navbar />
      
      <main className="container px-4 py-6 mx-auto max-w-2xl">
        
        {/* 1. TOP FINANCE CARDS */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="p-5 text-white bg-orange-400 shadow-sm rounded-3xl">
            <h3 className="text-2xl font-bold tracking-tight">{Number(stats.balance).toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
            <p className="mt-1 text-xs font-medium text-orange-50">Available balance</p>
          </div>
          <div className="p-5 text-white bg-green-400 shadow-sm rounded-3xl">
            <h3 className="text-2xl font-bold tracking-tight">{Number(stats.todayEarnings).toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
            <p className="mt-1 text-xs font-medium text-green-50">Today's earnings</p>
          </div>
          <div className="p-5 text-white bg-purple-400 shadow-sm rounded-3xl">
            <h3 className="text-2xl font-bold tracking-tight">{Number(stats.deposits).toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
            <p className="mt-1 text-xs font-medium text-purple-50">Deposit amount</p>
          </div>
          <div className="p-5 text-white bg-blue-400 shadow-sm rounded-3xl">
            <h3 className="text-2xl font-bold tracking-tight">{Number(stats.withdrawals).toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
            <p className="mt-1 text-xs font-medium text-blue-50">Withdrawal amount</p>
          </div>
        </div>

        {/* 2. PRODUCT CENTER HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
             <h2 className="text-xl font-bold text-gray-800">
               {user.role === 'admin' ? 'Product Management' : 'Product'}
             </h2>
          </div>
          
          {user.role === 'admin' && (
            <button className="px-4 py-2 text-sm font-bold text-white bg-teal-500 rounded hover:bg-teal-600">
              + Add New Product
            </button>
          )}
        </div>
        
        {/* 3. PRODUCT LIST (Vertical List Layout) */}
        <div className="flex flex-col space-y-4">
          {products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No products available.</div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="relative flex p-4 bg-white shadow-sm rounded-2xl">
                
                {/* Admin Delete Button */}
                {user.role === 'admin' && (
                  <button 
                    onClick={() => handleDelete(product.id)} 
                    className="absolute top-2 right-2 px-2.5 py-1 text-[10px] font-bold text-white bg-red-500 rounded hover:bg-red-600 z-10 shadow-sm"
                  >
                    Delete
                  </button>
                )}

                {/* Left Side: Image & Buy Button */}
                <div className="flex flex-col w-24 mr-4 shrink-0 mt-6">
                  <div className="w-full aspect-square bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-300">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                  </div>
                  <button 
                    onClick={() => handleBuy(product)}
                    disabled={processingId === product.id}
                    className="w-full py-2 text-sm font-bold text-white transition bg-teal-400 rounded-full hover:bg-teal-500 disabled:opacity-50 tracking-wide"
                  >
                    {processingId === product.id ? '...' : 'Buy'}
                  </button>
                </div>

                {/* Right Side: Details */}
                <div className="flex flex-col justify-center flex-1 space-y-2">
                  <h3 className="text-sm font-extrabold text-gray-500 mb-1">{product.name}</h3>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Price:</span>
                    <span className="font-bold text-gray-500">KSH {Number(product.price).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Duration:</span>
                    <span className="font-bold text-gray-500">KSH {Number(product.daily_profit).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Period:</span>
                    <span className="font-bold text-gray-500">{product.duration_days} days</span>
                  </div>
                  
                  <div className="flex justify-between pt-2 mt-1 text-xs">
                    <span className="text-gray-400">Total earnings:</span>
                    <span className="font-extrabold text-gray-500">KSH {Number(product.daily_profit * product.duration_days).toLocaleString()}</span>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;