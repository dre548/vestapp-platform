const StatCard = ({ title, amount, prefix = "KES" }) => {
  return (
    <div className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 uppercase">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-gray-800">
        <span className="text-xl text-gray-400 mr-1">{prefix}</span>
        {amount.toLocaleString()}
      </p>
    </div>
  );
};

export default StatCard;