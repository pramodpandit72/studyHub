import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/common/Loader';
import { SEO } from '../components/common/SEO';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <>
        <SEO noindex={true} />
        <PageLoader />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <SEO noindex={true} />
        <Navigate to="/login" state={{ from: location }} replace />
      </>
    );
  }

  return (
    <>
      <SEO noindex={true} />
      {children}
    </>
  );
};
