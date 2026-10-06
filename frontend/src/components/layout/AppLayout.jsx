import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const AppLayout = ({ showFooter = true }) => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-900 text-text-primary antialiased">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
};
