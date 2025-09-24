'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division'

interface Problem {
  num1: number
  num2: number
  answer: number
  symbol: string
}

const operationConfig = {
  addition: { symbol: '+', name: 'Addition', color: 'bg-green-500' },
  subtraction: { symbol: '-', name: 'Subtraction', color: 'bg-blue-500' },
  multiplication: { symbol: '×', name: 'Multiplication', color: 'bg-purple-500' },
  division: { symbol: '÷', name: 'Division', color: 'bg-orange-500' },
}

export default function GamePage() {
  const params = useParams()
  const operation = params.operation as Operation
  const config = operationConfig[operation]

  const [level, setLevel] = useState(1)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(10)
  const [gameState, setGameState] = useState<'playing' | 'correct' | 'wrong' | 'timeout'>('playing')
  const [showFeedback, setShowFeedback] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load level from session storage
  useEffect(() => {
    const savedLevel = sessionStorage.getItem(`mathhill-${operation}-level`)
    if (savedLevel) {
      setLevel(parseInt(savedLevel))
    }
  }, [operation])

  // Save level to session storage
  useEffect(() => {
    sessionStorage.setItem(`mathhill-${operation}-level`, level.toString())
  }, [level, operation])

  // Generate problem based on operation and level
  const generateProblem = (): Problem => {
    let num1: number, num2: number, answer: number

    switch (operation) {
      case 'addition':
        // Level 1-50: single digit, 51-200: double digit, etc.
        const maxDigitsAdd = Math.min(5, Math.floor(level / 200) + 1)
        const maxNumAdd = Math.pow(10, maxDigitsAdd) - 1
        num1 = Math.floor(Math.random() * maxNumAdd) + 1
        num2 = Math.floor(Math.random() * maxNumAdd) + 1
        answer = num1 + num2
        return { num1, num2, answer, symbol: '+' }

      case 'subtraction':
        const maxDigitsSub = Math.min(5, Math.floor(level / 200) + 1)
        const maxNumSub = Math.pow(10, maxDigitsSub) - 1
        num1 = Math.floor(Math.random() * maxNumSub) + 1
        num2 = Math.floor(Math.random() * num1) + 1 // Ensure positive result
        answer = num1 - num2
        return { num1, num2, answer, symbol: '-' }

      case 'multiplication':
        // Start with single digits, progress to larger numbers
        if (level <= 100) {
          num1 = Math.floor(Math.random() * 9) + 1
          num2 = Math.floor(Math.random() * 9) + 1
        } else if (level <= 500) {
          num1 = Math.floor(Math.random() * 99) + 1
          num2 = Math.floor(Math.random() * 99) + 1
        } else {
          num1 = Math.floor(Math.random() * 999) + 1
          num2 = Math.floor(Math.random() * 999) + 1
        }
        answer = num1 * num2
        return { num1, num2, answer, symbol: '×' }

      case 'division':
        // Generate division problems with whole number answers
        if (level <= 100) {
          answer = Math.floor(Math.random() * 9) + 1
          num2 = Math.floor(Math.random() * 9) + 1
        } else if (level <= 500) {
          answer = Math.floor(Math.random() * 99) + 1
          num2 = Math.floor(Math.random() * 99) + 1
        } else {
          answer = Math.floor(Math.random() * 999) + 1
          num2 = Math.floor(Math.random() * 999) + 1
        }
        num1 = answer * num2
        return { num1, num2, answer, symbol: '÷' }

      default:
        return { num1: 1, num2: 1, answer: 2, symbol: '+' }
    }
  }

  // Initialize first problem
  useEffect(() => {
    setProblem(generateProblem())
  }, [operation, level])

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timeoutRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleTimeout()
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [timeLeft, gameState])

  // Auto-focus input
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [gameState, problem])

  const handleTimeout = () => {
    setGameState('timeout')
    setShowFeedback(true)
    feedbackTimeoutRef.current = setTimeout(nextProblem, 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!problem || userAnswer === '') return

    const isCorrect = parseInt(userAnswer) === problem.answer

    if (isCorrect) {
      setGameState('correct')
      setLevel(Math.min(1000, level + 1))
      setShowFeedback(true)
      feedbackTimeoutRef.current = setTimeout(nextProblem, 1500)
    } else {
      setGameState('wrong')
      setLevel(Math.max(1, level - 5))
      setShowFeedback(true)
      feedbackTimeoutRef.current = setTimeout(nextProblem, 2000)
    }
  }

  const nextProblem = () => {
    setGameState('playing')
    setShowFeedback(false)
    setUserAnswer('')
    setTimeLeft(10)
    setProblem(generateProblem())
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
  }

  const resetLevel = () => {
    setLevel(1)
    sessionStorage.setItem(`mathhill-${operation}-level`, '1')
    nextProblem()
  }

  if (!problem) return <div>Loading...</div>

  return (
    <div className={`min-h-screen ${config.color} flex flex-col items-center justify-center p-4 text-white`}>
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Link
          href="/"
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
        >
          ← Home
        </Link>
        <div className="text-center">
          <div className="text-lg font-semibold">{config.name}</div>
          <div className="text-sm opacity-75">Level {level}</div>
        </div>
        <button
          onClick={resetLevel}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Timer */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
        <div className="w-64 h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 10) * 100}%` }}
          />
        </div>
        <div className="text-center mt-2 text-sm opacity-75">
          {timeLeft}s
        </div>
      </div>

      {/* Main Game Area */}
      <div className="text-center space-y-8">
        {!showFeedback ? (
          <>
            {/* Problem */}
            <div className="text-6xl md:text-8xl font-bold space-y-4">
              <div>{problem.num1}</div>
              <div>{problem.symbol} {problem.num2}</div>
              <div className="border-t-4 border-white pt-4">
                <form onSubmit={handleSubmit} className="inline-block">
                  <input
                    ref={inputRef}
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="text-center bg-transparent border-b-4 border-white outline-none w-48 placeholder-white/50"
                    placeholder="?"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                  />
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
            {gameState === 'correct' && (
              <div className="animate-bounce text-8xl">🎉</div>
            )}
            {(gameState === 'wrong' || gameState === 'timeout') && (
              <>
                <div className="text-6xl">❌</div>
                <div className="text-4xl">
                  Correct answer: {problem.answer}
                </div>
              </>
            )}
            <div className="text-2xl">
              {gameState === 'correct' && 'Excellent! +1 Level'}
              {gameState === 'wrong' && 'Try again! -5 Levels'}
              {gameState === 'timeout' && 'Time\'s up! -5 Levels'}
            </div>
          </div>
        )}
      </div>

      {/* Level visualization at bottom */}
      <div className="absolute bottom-8 left-4 right-4">
        <div className="text-center">
          <div className="text-sm opacity-75 mb-2">Your Progress</div>
          <div className="w-full h-4 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${(level / 1000) * 100}%` }}
            />
          </div>
          <div className="text-xs opacity-75 mt-1">
            {level} / 1000
          </div>
        </div>
      </div>
    </div>
  )
}