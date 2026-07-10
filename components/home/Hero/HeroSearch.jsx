import { useState, useRef, useEffect, useId } from 'react';
import { useRouter } from 'next/router';
import useDebounce from '../../../hooks/useDebounce';
import styles from './HeroSearch.module.css';

const POPULAR_SEARCHES = ['Writing', 'Coding', 'Images', 'Research', 'Video', 'Automation'];
const RECENT_KEY = 'sh_recent_searches';

/**
 * HeroSearch — live-filtering search box for the homepage hero.
 * - Debounces input before filtering `tools` (avoids re-filtering every keystroke)
 * - Shows up to 5 matching tools in an accessible combobox listbox
 * - Falls back to popular category chips and (if present) recent searches
 * - "/" focuses the input from anywhere on the page, like Linear/GitHub
 */
export default function HeroSearch({ tools = [] }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState([]);
  const inputRef = useRef(null);
  const router = useRouter();
  const listboxId = useId();
  const debouncedQuery = useDebounce(query, 150);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      setRecent(stored.slice(0, 3));
    } catch {
      /* private browsing / quota */
    }
  }, []);

  // Global "/" and Cmd+K / Ctrl+K shortcuts to focus search, unless
  // already typing somewhere. Cmd+K also prevents the browser's default
  // (e.g. address bar focus in some browsers) since it's a more
  // "claimed" shortcut than plain "/".
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';

      if (isCmdK) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const matches = debouncedQuery.trim()
    ? tools
        .filter((t) => {
          const q = debouncedQuery.toLowerCase();
          return (
            t.name.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            t.tags?.some((tag) => tag.toLowerCase().includes(q))
          );
        })
        .slice(0, 5)
    : [];

  const saveRecent = (term) => {
    try {
      const updated = [term, ...recent.filter((r) => r !== term)].slice(0, 3);
      setRecent(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      /* private browsing / quota */
    }
  };

  const runSearch = (term) => {
    const q = term.trim();
    if (!q) return;
    saveRecent(q);
    setIsOpen(false);
    router.push(`/tools?q=${encodeURIComponent(q)}`);
  };

  const goToTool = (tool) => {
    saveRecent(tool.name);
    setIsOpen(false);
    router.push(`/tools/${tool.slug}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!isOpen || matches.length === 0) {
      if (e.key === 'Enter') runSearch(query);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) goToTool(matches[activeIndex]);
      else runSearch(query);
    }
  };

  const suggestionChips = recent.length > 0 ? recent : POPULAR_SEARCHES;
  const chipsLabel = recent.length > 0 ? 'Recent searches' : 'Popular searches';

  return (
    <div className={styles.wrap}>
      <div
        className={styles.searchBox}
        role="search"
        data-open={isOpen && matches.length > 0}
      >
        <svg className={styles.icon} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search AI tools..."
          aria-label="Search AI tools"
          role="combobox"
          aria-expanded={isOpen && matches.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          className={styles.input}
        />
        {!query && (
          <kbd className={styles.shortcut} aria-hidden="true" title="Press / or ⌘K to search">/</kbd>
        )}
        <button
          onClick={() => runSearch(query)}
          aria-label="Submit search"
          className={styles.submit}
        >
          Search
        </button>

        {isOpen && matches.length > 0 && (
          <ul id={listboxId} role="listbox" className={styles.suggestions}>
            {matches.map((tool, i) => (
              <li
                key={tool.id}
                role="option"
                aria-selected={i === activeIndex}
                className={styles.suggestion}
                data-active={i === activeIndex}
                onMouseDown={() => goToTool(tool)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <span className={styles.suggestionName}>{tool.name}</span>
                <span className={styles.suggestionCategory}>{tool.category}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.chips}>
        <span className={styles.chipsLabel}>{chipsLabel}:</span>
        {suggestionChips.map((term) => (
          <button
            key={term}
            className={styles.chip}
            onClick={() => runSearch(term)}
            type="button"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
