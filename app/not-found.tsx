export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🏥</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Page Not Found</h2>
        <p className="text-gray-500 mb-6 text-sm">
          This page doesn&apos;t exist. For medical emergencies call{" "}
          <a href="tel:108" className="text-red-600 font-bold underline">
            108
          </a>
        </p>
        <a
          href="/"
          className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          Go to Home
        </a>
      </div>
    </div>
  )
}
