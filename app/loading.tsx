export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading RuralHealth...</p>
        <p className="text-sm mt-2 text-red-500">
          Emergency? Call{" "}
          <a href="tel:108" className="font-bold underline">108</a>
        </p>
      </div>
    </div>
  )
}
