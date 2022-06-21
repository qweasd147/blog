import { useState, useEffect } from 'react';

const useMedia = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);

    if (mql.matches !== matches) {
      setMatches(mql.matches);
    }

    const listener = (e) => {
      setMatches(e.matches);
    };

    if (mql.addEventListener) {
      mql.addEventListener('change', listener);
    } else {
      mql.addListener(listener);
    }

    return () => {
      if (mql.addEventListener) {
        mql.removeEventListener('change', listener);
      } else {
        mql.removeListener(listener);
      }
    };
  }, []);

  return matches;
};

export default useMedia;
