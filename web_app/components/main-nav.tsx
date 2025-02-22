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
      <div className="flex h-16 items-center w-full pr-4">
        <Link href="/" className="flex items-center gap-2 ml-4">
          <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">S</span>
          </div>
          <span className="font-bold text-2xl">Stride</span>
        </Link>
        <nav className="flex items-center justify-between flex-1">
          <div className="flex items-center space-x-4 ml-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/exercise">
              <Button variant="ghost">Exercise</Button>
            </Link>
            <Link href="/chat">
              <Button variant="ghost">Chat</Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
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
          </div>
        </nav>
      </div>
    </header>
  )
}

