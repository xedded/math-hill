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
  const [shakeEffect, setShakeEffect] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
        num2 = Math.floor(Math.random() * num1) + 1
        answer = num1 - num2
        return { num1, num2, answer, symbol: '-' }

      case 'multiplication':
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
    triggerShakeEffect()
    setShowFeedback(true)
    feedbackTimeoutRef.current = setTimeout(nextProblem, 2000)
  }

  const triggerShakeEffect = () => {
    setShakeEffect(true)
    if (containerRef.current) {
      containerRef.current.style.animation = 'shake 0.6s cubic-bezier(.36,.07,.19,.97) both'
    }
    setTimeout(() => {
      setShakeEffect(false)
      if (containerRef.current) {
        containerRef.current.style.animation = ''
      }
    }, 600)
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
      triggerShakeEffect()
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
    <>
      <style jsx>{`
        @keyframes shake {
          10%, 90% {
            transform: translate3d(-1px, 0, 0) rotate(-1deg);
          }
          20%, 80% {
            transform: translate3d(2px, 0, 0) rotate(1deg);
          }
          30%, 50%, 70% {
            transform: translate3d(-4px, 0, 0) rotate(-2deg);
          }
          40%, 60% {
            transform: translate3d(4px, 0, 0) rotate(2deg);
          }
        }
        @keyframes correctPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes wrongFlash {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.3; }
        }
        .shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
        .correct-pulse {
          animation: correctPulse 0.8s ease-in-out;
        }
        .wrong-flash {
          animation: wrongFlash 0.8s ease-in-out;
        }
      `}</style>

      <div
        ref={containerRef}
        className={`min-h-screen ${config.color} flex flex-col items-center justify-center p-4 text-white overflow-hidden`}
      >
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
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
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
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
        <div className={`text-center space-y-8 ${showFeedback && gameState === 'correct' ? 'correct-pulse' : ''} ${showFeedback && (gameState === 'wrong' || gameState === 'timeout') ? 'wrong-flash' : ''}`}>
          {!showFeedback ? (
            <>
              {/* Problem with inline styling */}
              <div
                style={{
                  fontSize: 'clamp(3rem, 8vw, 6rem)',
                  fontWeight: 'bold',
                  lineHeight: '1.2',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <span style={{ display: 'block' }}>{problem.num1}</span>
                <span style={{ display: 'block' }}>{problem.symbol} {problem.num2}</span>
                <div style={{ borderTop: '4px solid white', paddingTop: '1rem', minWidth: '200px' }}>
                  <form onSubmit={handleSubmit} style={{ display: 'inline-block' }}>
                    <input
                      ref={inputRef}
                      type="number"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      style={{
                        textAlign: 'center',
                        background: 'transparent',
                        borderBottom: '4px solid white',
                        outline: 'none',
                        width: 'min(300px, 80vw)',
                        fontSize: 'clamp(2rem, 6vw, 4rem)',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '0.5rem 0',
                        caretColor: 'white'
                      }}
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
                <div
                  style={{
                    fontSize: '8rem',
                    animation: 'correctPulse 0.8s ease-in-out',
                    filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.8))'
                  }}
                >
                  ✨ PERFECT! ✨
                </div>
              )}
              {(gameState === 'wrong' || gameState === 'timeout') && (
                <>
                  <div
                    style={{
                      fontSize: '6rem',
                      color: '#ff4444',
                      textShadow: '0 0 20px rgba(255,68,68,0.8)',
                      animation: 'wrongFlash 0.8s ease-in-out'
                    }}
                  >
                    💥 OOPS! 💥
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(2rem, 5vw, 4rem)',
                      fontWeight: 'bold',
                      textShadow: '0 0 10px rgba(255,255,255,0.5)'
                    }}
                  >
                    Answer: {problem.answer}
                  </div>
                </>
              )}
              <div
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: 'bold',
                  textShadow: '0 0 10px rgba(255,255,255,0.3)'
                }}
              >
                {gameState === 'correct' && 'LEVEL UP! +1'}
                {gameState === 'wrong' && 'TRY HARDER! -5 Levels'}
                {gameState === 'timeout' && 'TOO SLOW! -5 Levels'}
              </div>
            </div>
          )}
        </div>

        {/* Level visualization at bottom */}
        <div className="absolute bottom-8 left-4 right-4 z-10">
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

        {/* Background effects */}
        {showFeedback && gameState === 'correct' && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)`,
              animation: 'correctPulse 1.5s ease-in-out'
            }}
          />
        )}

        {showFeedback && (gameState === 'wrong' || gameState === 'timeout') && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              background: `radial-gradient(circle at 50% 50%, rgba(255,68,68,0.2) 0%, transparent 50%)`,
              animation: 'wrongFlash 0.8s ease-in-out'
            }}
          />
        )}
      </div>
    </>
  )
}