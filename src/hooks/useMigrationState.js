import { useEffect, useState } from 'react';
import { getMigrationState } from '../config/migration';

export function useMigrationState(search) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  return getMigrationState({ nowMs, search });
}

export default useMigrationState;
