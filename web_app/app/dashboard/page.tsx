import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Dashboard() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Your Physiotherapy Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Exercise Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Placeholder for exercise progress chart</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Placeholder for upcoming sessions list</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Placeholder for recent AI feedback</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

