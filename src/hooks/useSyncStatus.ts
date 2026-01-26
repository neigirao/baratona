import { useState, useCallback, useEffect, useRef } from 'react';

export function useSyncStatus() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  
  // Update seconds ago every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastUpdated]);
  
  const markUpdated = useCallback(() => {
    setLastUpdated(new Date());
    setSecondsAgo(0);
  }, []);
  
  const startRefresh = useCallback(() => {
    setIsRefreshing(true);
  }, []);
  
  const endRefresh = useCallback(() => {
    setIsRefreshing(false);
    markUpdated();
  }, [markUpdated]);
  
  return {
    lastUpdated,
    secondsAgo,
    isRefreshing,
    markUpdated,
    startRefresh,
    endRefresh,
  };
}
