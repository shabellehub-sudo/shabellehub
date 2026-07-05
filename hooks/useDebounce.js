import { useState, useEffect } from 'react';

/**
 * useDebounce — delays updating a value until `delay` ms have passed
 * without it changing. Used for live search so we don't re-filter
 * the tools list on every keystroke.
 */
export default function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
