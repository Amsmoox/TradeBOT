import React from 'react';

const SignalCard = ({ signal }) => {
  const { pair, action, sl, tp } = signal;

  const actionColor =
    action.toLowerCase() === 'buy' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';

  return (
    <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition">
      <h2 className="text-xl font-bold text-gray-800 mb-2">{pair}</h2>
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${actionColor}`}>
        {action}
      </span>
      <div className="mt-4 text-sm text-gray-600 space-y-1">
        <p>🛡️ SL: <span className="font-semibold">{sl}</span></p>
        <p>🎯 TP: <span className="font-semibold">{tp}</span></p>
      </div>
    </div>
  );
};

export default SignalCard;