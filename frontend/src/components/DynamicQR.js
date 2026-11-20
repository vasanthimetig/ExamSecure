import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";

const DynamicQR = ({ roomNo }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [seed, setSeed] = useState(Math.floor(Date.now() / 30000));

  useEffect(() => {
    const timer = setInterval(() => {
      const currentSeed = Math.floor(Date.now() / 30000);
      
      // Refresh seed and timer every 30 seconds
      if (currentSeed !== seed) {
        setSeed(currentSeed);
        setTimeLeft(30);
      } else {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 30));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [seed]);

  // This is the data the student will scan
  const qrValue = JSON.stringify({
    roomNo: roomNo,
    seed: seed, // This changes every 30 seconds
    type: "EXAM_ENTRY"
  });

  return (
    <div className="flex flex-col items-center p-10 bg-white rounded-3xl shadow-2xl border-4 border-indigo-600">
      <h2 className="text-2xl font-black text-indigo-900 mb-2">ROOM: {roomNo}</h2>
      <p className="text-slate-500 mb-6 text-sm font-bold uppercase tracking-widest">Scan to Authenticate Login</p>
      
      <div className="p-4 bg-white border-8 border-slate-100 rounded-2xl">
        <QRCode value={qrValue} size={300} level="H" />
      </div>

      <div className="mt-8 w-full max-w-xs bg-slate-100 h-3 rounded-full overflow-hidden">
        <div 
          className="bg-indigo-600 h-full transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / 30) * 100}%` }}
        ></div>
      </div>
      <p className="mt-3 text-indigo-600 font-black">REFRESHING IN {timeLeft}s</p>
    </div>
  );
};

export default DynamicQR;