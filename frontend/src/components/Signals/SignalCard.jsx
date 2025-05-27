import React from "react";

const SignalCard = ({ signal }) => {
  return (
    <div className="border p-4 rounded shadow">
      <h3 className="text-md font-semibold">{signal.pair}</h3>
      <p>Action: {signal.action}</p>
      <p>SL: {signal.sl}</p>
      <p>TP: {signal.tp}</p>
    </div>
  );
};

export default SignalCard;
