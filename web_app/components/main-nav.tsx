import Link from "next/link"
import { Button } from "@/components/ui/button"

export function MainNav() {
  return (
    <header className="bg-background border-b">
      <div className="container flex h-16 items-center justify-between">
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
        </nav>
      </div>
    </header>
  )
}

