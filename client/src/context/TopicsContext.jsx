import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const TopicsContext = createContext(null);

export function TopicsProvider({ children }) {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.topics.list();
      setTopics(data?.topics ?? []);
    } catch (_) {}
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <TopicsContext.Provider value={{ topics, refresh }}>
      {children}
    </TopicsContext.Provider>
  );
}

export const useTopics = () => useContext(TopicsContext);
