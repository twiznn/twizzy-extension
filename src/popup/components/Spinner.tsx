// components/Spinner.tsx

import React from "react"

const Spinner = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-12 h-12 border-4 border-t-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
    </div>
  )
}

export default Spinner
