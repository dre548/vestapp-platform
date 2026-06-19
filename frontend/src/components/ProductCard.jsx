import { useState } from "react";
import axios from "axios";

const ProductCard = ({ product }) => {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  
  // Modals for Admin
  const [showImageEdit, setShowImageEdit] = useState(false);
  const [showDetailsEdit, setShowDetailsEdit] = useState(false);
  
  // Image States
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Edit Form State
  const [editData, setEditData] = useState({
    name: product.name, 
    price: product.price, 
    daily_profit: product.daily_profit, 
    duration_days: product.duration_days
  });

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";

  // ----------------------------------------
  // USER ACTION: Buy Product
  // ----------------------------------------
  const handleInvest = async () => {
    if (product.status === 'locked') {
      setMessage("Product is locked.");
      setIsError(true);
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/investments/buy", 
        { productId: product.id }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Purchased!"); 
      setIsError(false); 
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed."); 
      setIsError(true); 
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // ----------------------------------------
  // ADMIN ACTION: Update Image
  // ----------------------------------------
  const handleImageUpdate = async (e) => {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData();
    if (imageFile) formData.append("imageFile", imageFile);
    if (imageUrl) formData.append("imageUrl", imageUrl);

    try {
      await axios.post(`http://localhost:5000/api/upload/product/${product.id}`, formData, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });
      setShowImageEdit(false);
      window.location.reload();
    } catch (error) { 
      alert("Failed to update image."); 
      setUploading(false);
    }
  };

  // ----------------------------------------
  // ADMIN ACTION: Edit Details
  // ----------------------------------------
  const handleEditDetails = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/admin/edit-product/${product.id}`, editData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setShowDetailsEdit(false);
      window.location.reload();
    } catch (error) { 
      alert("Failed to update details."); 
    }
  };

  // ----------------------------------------
  // ADMIN ACTION: Lock/Unlock
  // ----------------------------------------
  const handleToggleLock = async () => {
    const newStatus = product.status === 'locked' ? 'active' : 'locked';
    if(window.confirm(`Are you sure you want to ${newStatus} this product?`)) {
      try {
        await axios.put(`http://localhost:5000/api/admin/toggle-product/${product.id}`, { status: newStatus }, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        window.location.reload();
      } catch (error) { 
        alert("Failed to toggle status."); 
      }
    }
  };

  // ----------------------------------------
  // ADMIN ACTION: Delete
  // ----------------------------------------
  const handleDelete = async () => {
    if(window.confirm("Are you sure you want to delete this product? Users who already bought it will keep it, but it will vanish from the store.")) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/delete-product/${product.id}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        window.location.reload();
      } catch (error) { 
        alert("Failed to delete."); 
      }
    }
  };

  // Determine Image Source
  let imageSrc = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80";
  if (product.image) {
    if (product.image.startsWith("http")) imageSrc = product.image;
    else if (product.image.startsWith("uploads/")) imageSrc = `http://localhost:5000/${product.image}`;
    else imageSrc = `/images/${product.image}`;
  }

  return (
    <>
      <div className={`flex flex-row p-5 transition-shadow bg-white border shadow-sm rounded-xl relative group ${product.status === 'locked' ? 'border-red-300 opacity-80' : 'border-gray-100 hover:shadow-md'}`}>
        
        {/* Admin Toolkit (Shows on Hover for Admins) */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button 
              onClick={() => setShowDetailsEdit(true)} 
              className="px-3 py-1 text-xs font-bold text-white bg-blue-500 rounded shadow hover:bg-blue-600"
            >
              Edit
            </button>
            <button 
              onClick={() => setShowImageEdit(true)} 
              className="px-3 py-1 text-xs font-bold text-white bg-teal-500 rounded shadow hover:bg-teal-600"
            >
              Image
            </button>
            <button 
              onClick={handleToggleLock} 
              className={`px-3 py-1 text-xs font-bold text-white rounded shadow ${product.status === 'locked' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
            >
              {product.status === 'locked' ? 'Unlock' : 'Lock'}
            </button>
            <button 
              onClick={handleDelete} 
              className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded shadow hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        )}

        {/* Lock Overlay Badge */}
        {product.status === 'locked' && (
          <div className="absolute top-0 left-0 px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-br-lg rounded-tl-xl z-10">
            LOCKED
          </div>
        )}

        {/* Left Column: Image & Buy Button */}
        <div className="flex flex-col items-center justify-start shrink-0 w-1/3 sm:w-1/4 pt-2">
          <div className="w-full h-24 overflow-hidden bg-white border border-gray-100 rounded-lg">
            <img 
              src={imageSrc} 
              alt={product.name} 
              className={`object-cover w-full h-full ${product.status === 'locked' ? 'grayscale' : ''}`} 
              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80" }}
            />
          </div>
          
          <button 
            onClick={handleInvest} 
            disabled={product.status === 'locked'} 
            className={`w-full py-2 mt-4 text-sm font-bold text-white transition rounded-full shadow-sm ${product.status === 'locked' ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-400 hover:bg-teal-500'}`}
          >
            {product.status === 'locked' ? 'Locked' : 'Buy'}
          </button>
          
          {message && (
            <span className={`mt-2 text-xs font-medium text-center ${isError ? "text-red-500" : "text-green-500"}`}>
              {message}
            </span>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col justify-start pl-5 space-y-2.5 text-sm text-gray-500 w-2/3 sm:w-3/4 pt-2">
          <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
          
          <div className="flex items-center justify-between pb-1 border-b border-gray-50">
            <span>Price:</span> 
            <span className="font-semibold text-gray-800">KSH {Number(product.price).toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between pb-1 border-b border-gray-50">
            <span>Daily Earnings:</span> 
            <span className="font-bold text-green-500">KSH {Number(product.daily_profit).toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between pb-1 border-b border-gray-50">
            <span>Period:</span> 
            <span className="font-semibold text-gray-800">{product.duration_days} days</span>
          </div>
          
          <div className="flex items-center justify-between pt-1">
            <span>Total earnings:</span> 
            <span className="font-bold text-teal-600">KSH {Number(product.total_profit).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------- */}
      {/* MODAL: Edit Details */}
      {/* ---------------------------------------- */}
      {showDetailsEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-gray-800">Edit Product</h2>
            
            <form onSubmit={handleEditDetails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                <input 
                  type="text" 
                  value={editData.name} 
                  onChange={(e) => setEditData({...editData, name: e.target.value})} 
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (KES)</label>
                <input 
                  type="number" 
                  value={editData.price} 
                  onChange={(e) => setEditData({...editData, price: e.target.value})} 
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Daily Earning (KES)</label>
                <input 
                  type="number" 
                  value={editData.daily_profit} 
                  onChange={(e) => setEditData({...editData, daily_profit: e.target.value})} 
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
                <input 
                  type="number" 
                  value={editData.duration_days} 
                  onChange={(e) => setEditData({...editData, duration_days: e.target.value})} 
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" 
                  required 
                />
              </div>
              
              <div className="flex justify-end pt-4 space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowDetailsEdit(false)} 
                  className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------- */}
      {/* MODAL: Edit Image */}
      {/* ---------------------------------------- */}
      {showImageEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-gray-800">Update Image</h2>
            
            <form onSubmit={handleImageUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Option 1: Paste Web Link</label>
                <input 
                  type="text" 
                  value={imageUrl} 
                  onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); }} 
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" 
                  placeholder="https://..."
                />
              </div>
              
              <div className="text-center text-sm font-bold text-gray-400">OR</div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Option 2: Upload File</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => { setImageFile(e.target.files[0]); setImageUrl(""); }} 
                  className="w-full px-4 py-2 mt-1 text-sm border border-gray-300 rounded-lg" 
                />
              </div>
              
              <div className="flex justify-end pt-4 space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowImageEdit(false)} 
                  className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-bold text-white bg-teal-500 rounded-lg hover:bg-teal-600 disabled:bg-teal-300"
                >
                  {uploading ? "Saving..." : "Save Image"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;