'use client';

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { LoginButton } from "@/components/login-button"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"

export function MainNav() {
  const { user } = useAuth();

  return (
    <header className="bg-background border-b">
      <div className="flex h-16 items-center w-full px-8">
        <Link href="/" className="font-bold text-2xl flex items-center gap-2">
          <Image 
            src="/StrideLogo.png" 
            alt="Stride Logo"
            height={40}
            width={40}
            className="h-10 w-auto"
          />
          Stride
        </Link>
        <div className="flex items-center space-x-4 ml-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-lg">Dashboard</Button>
          </Link>
          <Link href="/exercise">
            <Button variant="ghost" className="text-lg">Exercise</Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost" className="text-lg">About</Button>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4 pr-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src={user.picture} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
                <span className="text-lg">{user.name}</span>
              </div>
              <LogoutButton />
            </div>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </header>
  )
}

