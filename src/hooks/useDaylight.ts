import { useEffect, useMemo, useState } from 'react';
import { ambientAt, currentHour, type Ambient } from '../lib/daylight';

/** The window light for right now, re-read once a minute. */
export function useDaylight(): Ambient {
  const [hour, setHour] = useState(currentHour);

  useEffect(() => {
    const t = window.setInterval(() => setHour(currentHour()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  return useMemo(() => ambientAt(hour), [hour]);
}
