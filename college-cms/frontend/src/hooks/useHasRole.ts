import { useAuth } from '../context/AuthContext';

export const useHasRole = (allowedRoles: string[]) => {
  const { user } = useAuth();
  if (!user) return false;
  return allowedRoles.includes(user.role);
};
