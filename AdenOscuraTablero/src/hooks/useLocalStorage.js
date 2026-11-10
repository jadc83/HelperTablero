import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue, readOnly = false) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (readOnly) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.warn(`LocalStorage quota exceeded for key "${key}". State is safely kept in IndexedDB memory instead.`);
      } else {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue, readOnly]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
