'use client';

import { Button } from "@/components/ui/button"
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const { setUser } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    // Clear user data from context
    setUser(null);
    
    // Clear all auth-related items from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('session');
    
    // Optional: Redirect to home page
    router.push('/');
    
    // Force a page refresh to clear any remaining state
    window.location.reload();
  };

  return (
    <Button 
      onClick={handleLogout}
      variant="destructive"
    >
      Logout
    </Button>
  );
} 