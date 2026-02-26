import React, { useState, useEffect } from 'react';
import moment from 'moment';

export default function WinStatusBar({ items = [] }) {
  const [time, setTime] = useState(moment().format('MM/DD/YYYY HH:mm:ss'));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(moment().format('MM/DD/YYYY HH:mm:ss'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="win-border-inset bg-secondary flex items-center text-[11px] font-mono px-1 h-6 mt-1">
      {items.map((item, i) => (
        <div key={i} className="win-border-inset px-2 py-0.5 mr-1 bg-card text-[11px]">
          {item}
        </div>
      ))}
      <div className="ml-auto win-border-inset px-2 py-0.5 bg-card text-[11px] font-bold">
        {time}
      </div>
    </div>
  );
}