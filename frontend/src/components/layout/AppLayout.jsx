import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const AppLayout = ({ showFooter = true }) => {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(
    typeof document !== 'undefined' && (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    )
  ));

  const location = useLocation();
  const isMockTestAttempt = location.pathname.startsWith('/mock-tests/') && location.pathname !== '/mock-tests/create';

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ));
    };

    handleFsChange();
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  // When full screen is enabled during mock test, hide nav bar completely
  const hideNav = isFullscreen && isMockTestAttempt;

  return (
    <div className={`min-h-screen flex flex-col bg-surface-50 dark:bg-surface-900 text-text-primary antialiased ${hideNav ? 'fullscreen-active-layout' : ''}`}>
      {!hideNav && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      {showFooter && !hideNav && <Footer />}
    </div>
  );
};
