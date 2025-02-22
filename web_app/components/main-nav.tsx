'use client';

import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { LoginButton } from "@/components/login-button"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"

export function MainNav() {
  const { user } = useAuth();

  return (
    <header className="bg-background border-b">
      <div className="container flex h-16 items-center justify-between ml-8">
        <Link href="/" className="font-bold text-xl">
          Stride
        </Link>
        <nav className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link href="/exercise">
            <Button variant="ghost">Exercise</Button>
          </Link>
          <Link href="/chat">
            <Button variant="ghost">Chat</Button>
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src={user.picture} 
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span>{user.name}</span>
              </div>
              <LogoutButton />
            </div>
          ) : (
            <LoginButton />
          )}
        </nav>
      </div>
    </header>
  )
}

