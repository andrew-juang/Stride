'use client';

import { Button } from "@/components/ui/button"
import { useAuth } from '@/components/auth-provider';

export function LogoutButton() {
  const { setUser } = useAuth();

  const handleLogout = () => {
    // Clear user data from context
    setUser(null);
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