import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function ProtectedRoute() {
  // Temporarily unrestricted for viewing
  return <Outlet />;
}
