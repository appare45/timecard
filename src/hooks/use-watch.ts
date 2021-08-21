import { useEffect, useState } from 'react';

export default function useWatch(interval: number): number {
  const [time, updateTime] = useState(Date.now());

  useEffect(() => {
    const timeoutId = setTimeout(() => updateTime(Date.now()), interval);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [interval, time]);

  return time;
}
