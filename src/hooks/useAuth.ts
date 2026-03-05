import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('care_api_key'));

  const login = (key: string) => {
    localStorage.setItem('care_api_key', key);
    setApiKey(key);
  };

  const logout = () => {
    localStorage.removeItem('care_api_key');
    setApiKey(null);
  };

  return {
    isAuthenticated: !!apiKey,
    apiKey,
    login,
    logout,
  };
};
