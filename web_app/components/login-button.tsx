'use client';

import { Button } from "@/components/ui/button"
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/components/auth-provider';

export function LoginButton() {
  const { user, setUser } = useAuth();
  const REDIRECT_URI = 'http://localhost:3000';

  const login = useGoogleLogin({
    flow: 'auth-code',
    redirect_uri: REDIRECT_URI,
    ux_mode: 'popup',
    scope: 'openid email profile',
    onSuccess: async (response) => {
      try {
        // Log everything for debugging
        console.log('Google auth response:', response);
        console.log('Using redirect URI:', REDIRECT_URI);
        
        const requestBody = { 
          code: response.code,
          redirect_uri: REDIRECT_URI
        };
        
        console.log('Sending to backend:', requestBody);
        
        const result = await fetch('http://localhost:8000/api/auth/google-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await result.json();
        
        if (!result.ok) {
          // Log the complete error response
          console.error('Login error response:', {
            status: result.status,
            statusText: result.statusText,
            data: data
          });
          throw new Error(data.detail || 'Login failed');
        }

        console.log('Login successful:', data);
        
        const userData = {
          email: data.email,
          name: data.name,
          picture: data.picture
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
    onError: (error) => console.error('Login Failed:', error)
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (user) {
    return (
      <Button 
        onClick={handleLogout}
        variant="destructive"
      >
        Logout
      </Button>
    );
  }

  return (
    <Button onClick={() => login()}>
      Sign in with Google
    </Button>
  );
} 