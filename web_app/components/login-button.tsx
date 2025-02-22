'use client';

import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';

export function LoginButton() {
  const { setUser } = useAuth();

  const login = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'popup',
    redirect_uri: 'http://localhost:3000/api/auth/callback/google',
    onSuccess: async (codeResponse) => {
      try {
        // Send token to backend
        const result = await fetch('/auth/google-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: codeResponse.code }),
        });

        const data = await result.json();
        
        if (data.status === 'success') {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
    onError: (errorResponse) => {
      console.error('Login Failed:', errorResponse);
    },
  });

  return (
    <Button onClick={() => login()}>
      Sign in with Google
    </Button>
  );
} 