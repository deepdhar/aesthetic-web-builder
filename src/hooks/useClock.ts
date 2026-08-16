'use client';

import { useEffect, useState } from 'react';

export function useClock(): string {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase());
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}
