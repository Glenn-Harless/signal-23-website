import { useEffect, useMemo, useState } from 'react';

const getViewportHeight = () => {
  if (typeof window === 'undefined') {
    return 0;
  }

  return window.visualViewport?.height ?? window.innerHeight;
};

export function useViewportHeight() {
  const [height, setHeight] = useState(() => getViewportHeight());

  useEffect(() => {
    const handleResize = () => {
      setHeight(getViewportHeight());
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);
    window.addEventListener('resize', handleResize);

    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return useMemo(() => height, [height]);
}
