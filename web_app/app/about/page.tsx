export default function About() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">About Stride</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
        <p className="text-lg mb-6">
          One of our team members went to physical therapy years ago for scoliosis. As with most physical therapy, 
          they were assigned exercises to do at home. Physical therapy is a serious issue, 
          so we believe that having a virtual physical therapist would be a good remedy to ensure safety and proper exercise.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">What Stride Does</h2>
        <p className="text-lg mb-6">
          The Virtual Physiotherapy Assistant is a web-based platform that utilizes AI-powered pose estimation 
          and chatbot support to assist patients in rehabilitation exercises. The system provides real-time feedback, 
          and mental health support to enhance adherence and recovery.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">Andrew Juang</h3>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">Alvin Li</h3>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">Benny C. Wang</h3>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">Edward Wu</h3>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Project Status</h2>
        <p className="text-lg">
          Stride was developed during Hacklytics 2025. We're continuously working to improve and expand its capabilities
          to better serve users in their physical therapy journey.
        </p>
      </section>
    </div>
  )
} 