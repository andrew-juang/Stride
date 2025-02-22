import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 text-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to Virtual Physiotherapy Assistant</h1>
      <p className="text-xl mb-8 max-w-2xl">
        Get real-time feedback on your exercises, track your progress, and receive personalized support through our
        AI-powered assistant.
      </p>
      <div className="flex space-x-4">
        <Link href="/dashboard">
          <Button size="lg">Get Started</Button>
        </Link>
        <Link href="/about">
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </Link>
      </div>
    </div>
  )
}

