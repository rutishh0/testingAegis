import { Navigate, useLocation } from 'react-router-dom';
import { useAdminContext } from '../state/AdminContext';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token } = useAdminContext();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;

