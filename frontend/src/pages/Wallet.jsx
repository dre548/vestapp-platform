import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const Wallet = () => {
  const [activeTab, setActiveTab] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  // State for STK Push Phone (Defaults to registered phone)
  const [phone, setPhone] = useState(user.phone || "");

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [balRes, txRes] = await Promise.all([
        axios.get("http://localhost:5000/api/wallet/balance", { headers }),
        axios.get("http://localhost:5000/api/wallet/transactions", { headers })
      ]);
      setBalance(balRes.data.balance);
      setTransactions(txRes.data);
    } catch (err) {
      console.error("Failed to fetch wallet data.");
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Handle M-PESA STK PUSH (Deposit)
  const handleDeposit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/mpesa/stkpush", {
        phone,
        amount,
        userId: user.id
      });
      setMessage({ text: res.data.message, type: "success" });
      setAmount("");
      
      // Start a countdown to refresh the history
      setTimeout(() => {
        fetchData();
        setMessage({ text: "Checking for payment receipt...", type: "success" });
      }, 10000);

    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Failed to initiate deposit.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Handle WITHDRAWAL Request
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/wallet/withdraw", 
        { amount }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ text: res.data.message, type: "success" });
      setAmount("");
      fetchData(); // Refresh history immediately to show the pending request
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Withdrawal failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <Navbar />
      
      <main className="container px-4 py-8 mx-auto max-w-3xl">
        
        {/* GLOBAL BALANCE CARD */}
        <div className="relative p-6 mb-6 overflow-hidden bg-teal-500 shadow-md rounded-2xl">
          <div className="absolute opacity-10 -right-6 -top-6">
            <svg className="w-40 h-40 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
          </div>
          <p className="text-sm font-medium text-teal-100 uppercase tracking-widest mb-1">Available Balance</p>
          <h2 className="text-4xl font-black text-white">KES {Number(balance).toLocaleString()}</h2>
        </div>

        {/* INTERACTIVE FORM SECTION */}
        <div className="p-6 mb-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
          
          {/* Tabs */}
          <div className="flex p-1 mb-6 bg-gray-100 rounded-lg">
            <button 
              onClick={() => { setActiveTab("deposit"); setMessage({text:"", type:""}); }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === "deposit" ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Deposit
            </button>
            <button 
              onClick={() => { setActiveTab("withdraw"); setMessage({text:"", type:""}); }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === "withdraw" ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Withdraw
            </button>
          </div>

          {message.text && (
            <div className={`p-3 mb-4 text-sm font-bold rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {message.text}
            </div>
          )}

          {/* DEPOSIT FORM */}
          {activeTab === "deposit" && (
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-bold text-gray-700">Amount to Deposit</label>
                <div className="relative">
                  <span className="absolute font-bold text-gray-400 left-4 top-3.5">KES</span>
                  <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full py-3 pl-14 pr-4 font-bold text-gray-800 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="0.00" />
                </div>
              </div>
              
              <div>
                <label className="block mb-1.5 text-sm font-bold text-gray-700">M-Pesa Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-3 font-bold text-gray-800 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="07XX XXX XXX" />
                <p className="mt-1 text-xs text-gray-400">Edit this number if you want to pay using a different phone.</p>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 font-bold text-white transition-all bg-teal-500 rounded-xl shadow-md hover:bg-teal-600 flex justify-center items-center">
                {loading ? "Processing..." : <>Confirm Deposit via <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" alt="M-Pesa" className="h-4 ml-2" /></>}
              </button>
            </form>
          )}

          {/* WITHDRAW FORM */}
          {activeTab === "withdraw" && (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="p-4 mb-4 text-sm text-blue-800 bg-blue-50 rounded-xl border border-blue-100">
                <p className="font-bold">Withdrawal Notice:</p>
                <p>Funds will be sent directly to your registered M-Pesa number: <strong>{user.phone}</strong> upon admin approval.</p>
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-bold text-gray-700">Amount to Withdraw</label>
                <div className="relative">
                  <span className="absolute font-bold text-gray-400 left-4 top-3.5">KES</span>
                  <input type="number" min="100" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full py-3 pl-14 pr-4 font-bold text-gray-800 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="0.00" />
                </div>
                <p className="mt-1 text-xs text-gray-400">Minimum withdrawal: KES 100</p>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 font-bold text-white transition-all bg-gray-800 rounded-xl shadow-md hover:bg-gray-900">
                {loading ? "Submitting..." : "Submit Withdrawal Request"}
              </button>
            </form>
          )}
        </div>

        {/* TRANSACTION HISTORY */}
        <h3 className="mb-4 text-lg font-bold text-gray-800">Transaction History</h3>
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-medium">No transactions yet.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 transition hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    {/* Dynamic Icon depending on transaction type */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'commission' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'commission' 
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /> // Arrow Down (Money IN)
                          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /> // Arrow Up (Money OUT)
                        }
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 capitalize">{tx.type}</p>
                      <p className="text-xs font-medium text-gray-400">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-black ${tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'commission' ? 'text-green-600' : 'text-gray-800'}`}>
                      {tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'commission' ? '+' : '-'} KES {Number(tx.amount).toLocaleString()}
                    </p>
                    <span className={`inline-block px-2 py-0.5 mt-1 text-[10px] font-bold tracking-wider uppercase rounded-md ${
                      tx.status === 'approved' ? 'bg-green-100 text-green-700' : 
                      tx.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Wallet;