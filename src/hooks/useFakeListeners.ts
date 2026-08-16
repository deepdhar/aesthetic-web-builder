import { useEffect, useState } from 'react';

export function useFakeListeners(): number {
  const [count, setCount] = useState(() => Math.floor(Math.random() * 30) + 5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        const next = prev + (Math.random() > 0.5 ? 1 : -1);
        return Math.max(1, Math.min(next, 120));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return count;
}
