import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";

const HODDynamicQR = ({ department, roomNo }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [seed, setSeed] = useState(Math.floor(Date.now() / 30000));

  useEffect(() => {
    const timer = setInterval(() => {
      const currentSeed = Math.floor(Date.now() / 30000);
      
      // Sync local timer with the global 30-second window
      if (currentSeed !== seed) {
        setSeed(currentSeed);
        setTimeLeft(30);
      } else {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 30));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [seed]);

  // QR Content strictly follows your security rules: 
  // Dept-wise info + Room No + Time Seed
  const qrValue = JSON.stringify({
    department: department,
    roomNo: roomNo,
    seed: seed,
    type: "EXAM_ENTRY"
  });

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-xl border-t-8 border-indigo-600">
      <h2 className="text-2xl font-black text-indigo-900 mb-1">{department} DEPARTMENT</h2>
      <p className="text-slate-500 mb-6 font-bold">ROOM NUMBER: {roomNo}</p>
      
      <div className="p-4 bg-white border-4 border-slate-50 rounded-xl">
        <QRCode value={qrValue} size={250} level="H" />
      </div>

      <div className="mt-6 w-full max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-indigo-600 h-full transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / 30) * 100}%` }}
        ></div>
      </div>
      <p className="mt-3 text-xs font-black text-indigo-600 uppercase tracking-tighter">
        Code expires in {timeLeft} seconds
      </p>
    </div>
  );
};

export default HODDynamicQR;