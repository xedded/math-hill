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
  const [gameState, setGameState] = useState<'playing' | 'correct' | 'great' | 'perfect' | 'wrong' | 'timeout'>('playing')
  const [showFeedback, setShowFeedback] = useState(false)
  const [shakeEffect, setShakeEffect] = useState(false)
  const [points, setPoints] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  // Calculate dynamic timer and bonus thresholds based on level
  const getTimerSettings = (level: number) => {
    const bonusTime = Math.floor(level / 100) * 5 // +5s every 100 levels
    const baseTime = 10 + bonusTime
    const perfectThreshold = 2 + Math.floor(level / 100) // +1s every 100 levels
    const greatThreshold = 5 + Math.floor(level / 100) // +1s every 100 levels

    return {
      maxTime: baseTime,
      perfectThreshold,
      greatThreshold
    }
  }

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

    // Calculate difficulty progression - smoother curve
    const getDifficultyRange = (level: number, operation: string) => {
      if (operation === 'addition' || operation === 'subtraction') {
        if (level <= 50) return { min: 1, max: 9 } // Single digits
        if (level <= 150) return { min: 1, max: 99 } // Two digits
        if (level <= 300) return { min: 10, max: 999 } // Three digits
        if (level <= 500) return { min: 100, max: 9999 } // Four digits
        return { min: 1000, max: 99999 } // Five digits
      } else {
        // Multiplication and division - more gradual
        if (level <= 100) return { min: 1, max: 9 } // Single digits
        if (level <= 250) return { min: 1, max: 19 } // Up to 19
        if (level <= 450) return { min: 1, max: 49 } // Up to 49
        if (level <= 700) return { min: 1, max: 99 } // Two digits
        return { min: 1, max: 199 } // Up to 199
      }
    }

    const range = getDifficultyRange(level, operation)

    switch (operation) {
      case 'addition':
        num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        answer = num1 + num2
        return { num1, num2, answer, symbol: '+' }

      case 'subtraction':
        num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        num2 = Math.floor(Math.random() * num1) + 1 // Ensure positive result
        answer = num1 - num2
        return { num1, num2, answer, symbol: '-' }

      case 'multiplication':
        num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        answer = num1 * num2
        return { num1, num2, answer, symbol: '×' }

      case 'division':
        answer = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        num1 = answer * num2
        return { num1, num2, answer, symbol: '÷' }

      default:
        return { num1: 1, num2: 1, answer: 2, symbol: '+' }
    }
  }

  // Initialize first problem
  useEffect(() => {
    setProblem(generateProblem())
    setStartTime(Date.now())
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
    setPoints(0)
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
    if (!problem || userAnswer === '' || !startTime) return

    const isCorrect = parseInt(userAnswer) === problem.answer
    const responseTime = (Date.now() - startTime) / 1000
    const timerSettings = getTimerSettings(level)

    if (isCorrect) {
      let earnedPoints = 1
      if (responseTime <= timerSettings.perfectThreshold) {
        earnedPoints = 10
        setGameState('perfect')
      } else if (responseTime <= timerSettings.greatThreshold) {
        earnedPoints = 5
        setGameState('great')
      } else {
        earnedPoints = 1
        setGameState('correct')
      }

      setPoints(earnedPoints)
      setLevel(Math.min(1000, level + earnedPoints))
      setShowFeedback(true)
      feedbackTimeoutRef.current = setTimeout(nextProblem, 2000)
    } else {
      setPoints(0)
      setGameState('wrong')
      setLevel(Math.max(1, level - 5))
      triggerShakeEffect()
      setShowFeedback(true)
      feedbackTimeoutRef.current = setTimeout(nextProblem, 2000)
    }
  }

  const nextProblem = () => {
    const timerSettings = getTimerSettings(level)
    setGameState('playing')
    setShowFeedback(false)
    setUserAnswer('')
    setTimeLeft(timerSettings.maxTime)
    setStartTime(Date.now())
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
      <style jsx global>{`
        /* Hide number input spinners completely */
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
          display: none;
        }
        input[type=number] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
        input[type=number]::-webkit-textfield-decoration-container {
          display: none;
        }
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
        @keyframes greatZoom {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(-2deg); }
          50% { transform: scale(1.1) rotate(1deg); }
          75% { transform: scale(1.15) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes perfectExplode {
          0% {
            transform: scale(1) rotate(0deg);
            filter: blur(0px) brightness(1) saturate(1);
          }
          20% {
            transform: scale(1.3) rotate(-5deg);
            filter: blur(1px) brightness(1.5) saturate(1.8);
          }
          40% {
            transform: scale(0.9) rotate(3deg);
            filter: blur(0.5px) brightness(1.8) saturate(2);
          }
          60% {
            transform: scale(1.2) rotate(-2deg);
            filter: blur(1.5px) brightness(2) saturate(2.5);
          }
          80% {
            transform: scale(1.05) rotate(1deg);
            filter: blur(0.3px) brightness(1.6) saturate(1.5);
          }
          100% {
            transform: scale(1) rotate(0deg);
            filter: blur(0px) brightness(1) saturate(1);
          }
        }
        @keyframes wrongFlash {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.3; }
        }
        @keyframes perfectGlow {
          0% {
            box-shadow: 0 0 20px rgba(255,255,255,0.3);
            filter: drop-shadow(0 0 10px rgba(255,255,255,0.5));
          }
          50% {
            box-shadow: 0 0 50px rgba(255,255,255,0.8), 0 0 100px rgba(255,255,255,0.4);
            filter: drop-shadow(0 0 30px rgba(255,255,255,1));
          }
          100% {
            box-shadow: 0 0 20px rgba(255,255,255,0.3);
            filter: drop-shadow(0 0 10px rgba(255,255,255,0.5));
          }
        }
        @keyframes greatFlash {
          0% { background: rgba(255,255,255,0); }
          50% { background: rgba(255,255,255,0.1); }
          100% { background: rgba(255,255,255,0); }
        }
        .shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
        .correct-pulse {
          animation: correctPulse 0.8s ease-in-out;
        }
        .great-zoom {
          animation: greatZoom 1.2s ease-in-out;
        }
        .perfect-explode {
          animation: perfectExplode 1.5s ease-in-out;
        }
        .wrong-flash {
          animation: wrongFlash 0.8s ease-in-out;
        }
        .perfect-glow {
          animation: perfectGlow 2s ease-in-out infinite;
        }
        .great-flash {
          animation: greatFlash 1s ease-in-out;
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
              style={{ width: `${(timeLeft / getTimerSettings(level).maxTime) * 100}%` }}
            />
          </div>
          <div className="text-center mt-2 text-sm opacity-75">
            {timeLeft}s
          </div>
        </div>

        {/* Main Game Area */}
        <div className={`text-center space-y-8 ${showFeedback && gameState === 'correct' ? 'correct-pulse' : ''} ${showFeedback && gameState === 'great' ? 'great-zoom' : ''} ${showFeedback && gameState === 'perfect' ? 'perfect-explode' : ''} ${showFeedback && (gameState === 'wrong' || gameState === 'timeout') ? 'wrong-flash' : ''}`}>
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
                  gap: '2rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span>{problem.num1}</span>
                  <span>{problem.symbol}</span>
                  <span>{problem.num2}</span>
                  <span>=</span>
                </div>
                <div style={{ borderTop: '4px solid white', paddingTop: '1rem', minWidth: '200px' }}>
                  <form onSubmit={handleSubmit} style={{ display: 'inline-block' }}>
                    <input
                      ref={inputRef}
                      type="number"
                      value={userAnswer}
                      onChange={(e) => {
                        const value = e.target.value
                        setUserAnswer(value)

                        // Auto-validate when correct number of digits is entered
                        const expectedDigits = problem.answer.toString().length
                        if (value.length === expectedDigits && value !== '' && !value.includes('.')) {
                          // Small delay to ensure state is updated
                          setTimeout(() => {
                            handleSubmit(new Event('submit') as any)
                          }, 10)
                        }
                      }}
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
                        caretColor: 'white',
                        border: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield',
                        appearance: 'none'
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
              {gameState === 'perfect' && (
                <div
                  className="perfect-glow"
                  style={{
                    fontSize: '10rem',
                    fontWeight: '900',
                    background: 'linear-gradient(45deg, #fff, #ffff00, #fff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 50px rgba(255,255,255,0.8)',
                    letterSpacing: '0.1em'
                  }}
                >
                  LIGHTNING!
                </div>
              )}
              {gameState === 'great' && (
                <div
                  style={{
                    fontSize: '8rem',
                    fontWeight: '800',
                    color: '#00ff88',
                    textShadow: '0 0 30px rgba(0,255,136,0.8), 0 0 60px rgba(0,255,136,0.4)',
                    filter: 'drop-shadow(0 0 20px rgba(0,255,136,0.6))'
                  }}
                >
                  FAST!
                </div>
              )}
              {gameState === 'correct' && (
                <div
                  style={{
                    fontSize: '6rem',
                    fontWeight: '700',
                    color: '#88ff88',
                    textShadow: '0 0 20px rgba(136,255,136,0.6)'
                  }}
                >
                  CORRECT!
                </div>
              )}
              {(gameState === 'wrong' || gameState === 'timeout') && (
                <>
                  <div
                    style={{
                      fontSize: '6rem',
                      fontWeight: '800',
                      color: '#ff4444',
                      textShadow: '0 0 20px rgba(255,68,68,0.8)',
                      animation: 'wrongFlash 0.8s ease-in-out'
                    }}
                  >
                    WRONG!
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
                {gameState === 'perfect' && `INCREDIBLE! +${points} LEVELS`}
                {gameState === 'great' && `AMAZING! +${points} LEVELS`}
                {gameState === 'correct' && `GOOD! +${points} LEVEL`}
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
        {showFeedback && gameState === 'perfect' && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              background: `
                radial-gradient(circle at 30% 20%, rgba(255,255,0,0.3) 0%, transparent 50%),
                radial-gradient(circle at 70% 80%, rgba(255,255,255,0.2) 0%, transparent 60%),
                radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)
              `,
              animation: 'perfectExplode 1.5s ease-in-out'
            }}
          />
        )}

        {showFeedback && gameState === 'great' && (
          <div
            className="great-flash"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              background: `radial-gradient(circle at 50% 50%, rgba(0,255,136,0.2) 0%, transparent 70%)`
            }}
          />
        )}

        {showFeedback && gameState === 'correct' && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              background: `radial-gradient(circle at 50% 50%, rgba(136,255,136,0.15) 0%, transparent 70%)`,
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