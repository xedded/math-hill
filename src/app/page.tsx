'use client'
import Link from 'next/link'

const operations = [
  { symbol: '+', name: 'Addition', path: '/game/addition', color: 'bg-green-500' },
  { symbol: '-', name: 'Subtraction', path: '/game/subtraction', color: 'bg-blue-500' },
  { symbol: '×', name: 'Multiplication', path: '/game/multiplication', color: 'bg-purple-500' },
  { symbol: '÷', name: 'Division', path: '/game/division', color: 'bg-orange-500' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl md:text-8xl font-bold text-indigo-600 mb-4 tracking-tight">
          Math Hill
        </h1>
        <p className="text-xl text-gray-600 max-w-md mx-auto">
          Climb the mathematical mountain one problem at a time!
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 max-w-4xl w-full">
        {operations.map((op) => (
          <Link
            key={op.name}
            href={op.path}
            className={`${op.color} hover:opacity-90 transition-all duration-200 transform hover:scale-105 rounded-2xl p-8 md:p-12 text-center shadow-lg hover:shadow-xl`}
          >
            <div className="text-white">
              <div className="text-4xl md:text-6xl font-bold mb-2">
                {op.symbol}
              </div>
              <div className="text-sm md:text-base font-medium opacity-90">
                {op.name}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Choose an operation to start your math adventure!</p>
      </div>
    </div>
  )
}