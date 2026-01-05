import React, { useState, useEffect } from 'react'
import { civicsQuestions } from '../data/civicsQuestions'
import { saveCivicsProgress, loadCivicsProgress } from '../utils/storage'

export default function CivicsQuiz() {
  const [progress, setProgress] = useState({ attempts: [] })
  const [currentQuiz, setCurrentQuiz] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    loadCivicsProgress().then(p => setProgress(p))
  }, [])

  const selectWeightedQuestions = () => {
    // Build frequency map (less frequently asked questions get higher weight)
    const questionFrequency = {}
    civicsQuestions.forEach(q => {
      questionFrequency[q.id] = 0
    })

    progress.attempts.forEach(attempt => {
      attempt.questions.forEach(qId => {
        questionFrequency[qId] = (questionFrequency[qId] || 0) + 1
      })
    })

    const maxFreq = Math.max(...Object.values(questionFrequency), 1)

    // Create weighted pool
    const weightedPool = []
    civicsQuestions.forEach(q => {
      const weight = maxFreq - questionFrequency[q.id] + 1
      for (let i = 0; i < weight; i++) {
        weightedPool.push(q)
      }
    })

    // Select 10 unique questions
    const selected = []
    const usedIds = new Set()

    while (selected.length < 10 && weightedPool.length > 0) {
      const randomQ = weightedPool[Math.floor(Math.random() * weightedPool.length)]
      if (!usedIds.has(randomQ.id)) {
        selected.push(randomQ)
        usedIds.add(randomQ.id)
      }
    }

    return selected
  }

  const generateAnswerOptions = (correctAnswer, questionId) => {
    // Get 3 random wrong answers from other questions
    const otherQuestions = civicsQuestions.filter(q => q.id !== questionId)
    const shuffled = [...otherQuestions].sort(() => Math.random() - 0.5)
    
    // For questions with multiple correct answers, pick one randomly
    const correctAnswerText = Array.isArray(correctAnswer) 
      ? correctAnswer[Math.floor(Math.random() * correctAnswer.length)]
      : correctAnswer

    const wrongAnswers = shuffled.slice(0, 3).map(q => 
      Array.isArray(q.answer) ? q.answer[0] : q.answer
    )

    // Combine and shuffle
    const allOptions = [correctAnswerText, ...wrongAnswers]
    return allOptions.sort(() => Math.random() - 0.5).map((text, i) => ({
      id: i,
      text,
      isCorrect: text === correctAnswerText
    }))
  }

  const startQuiz = () => {
    const questions = selectWeightedQuestions()
    const quizData = questions.map(q => ({
      ...q,
      options: generateAnswerOptions(q.answer, q.id),
      userAnswer: null,
      correct: false
    }))

    setCurrentQuiz(quizData)
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setQuizComplete(false)
    setScore(0)
  }

  const handleAnswerSelect = (option) => {
    if (isAnswered) return
    setSelectedAnswer(option)
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return

    const updatedQuiz = [...currentQuiz]
    updatedQuiz[currentIndex].userAnswer = selectedAnswer.text
    updatedQuiz[currentIndex].correct = selectedAnswer.isCorrect

    setCurrentQuiz(updatedQuiz)
    setIsAnswered(true)

    if (selectedAnswer.isCorrect) {
      setScore(score + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentIndex < currentQuiz.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = () => {
    const totalCorrect = currentQuiz.filter(q => q.correct).length
    const attempt = {
      date: new Date().toISOString(),
      questions: currentQuiz.map(q => q.id),
      totalCorrect,
      percentage: (totalCorrect / currentQuiz.length) * 100
    }

    const updatedProgress = {
      attempts: [...progress.attempts, attempt]
    }

    setProgress(updatedProgress)
    saveCivicsProgress(updatedProgress)
    setQuizComplete(true)
  }

  const currentQuestion = currentQuiz[currentIndex]

  if (currentQuiz.length === 0) {
    return (
      <div className="civics-quiz">
        <div className="quiz-intro">
          <h2>Civics Test Practice</h2>
          <p>Practice the 100 civics questions for the U.S. naturalization test.</p>
          <p>You'll be asked 10 random questions. Questions you haven't seen recently are prioritized.</p>
          
          {progress.attempts.length > 0 && (
            <div className="past-attempts">
              <h3>Recent Scores</h3>
              <ul>
                {progress.attempts.slice(-5).reverse().map((attempt, i) => (
                  <li key={i}>
                    {new Date(attempt.date).toLocaleDateString()}: {attempt.totalCorrect}/10 ({attempt.percentage.toFixed(0)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={startQuiz} className="btn-primary">Start Quiz</button>
        </div>
      </div>
    )
  }

  if (quizComplete) {
    const passingScore = score >= 6
    return (
      <div className="civics-quiz">
        <div className="quiz-results">
          <h2>{passingScore ? '✅ Passed!' : '❌ Not Quite'}</h2>
          <p className="score-display">Score: {score}/10 ({(score / 10 * 100).toFixed(0)}%)</p>
          <p>{passingScore ? 'You need 6/10 to pass the actual test. Great job!' : 'You need 6/10 to pass. Keep practicing!'}</p>

          <div className="review-answers">
            <h3>Review</h3>
            {currentQuiz.map((q, i) => (
              <div key={i} className={`review-item ${q.correct ? 'correct' : 'incorrect'}`}>
                <p><strong>Q{i + 1}:</strong> {q.question}</p>
                <p className="user-answer">
                  Your answer: {q.userAnswer} {q.correct ? '✅' : '❌'}
                </p>
                {!q.correct && (
                  <p className="correct-answer">
                    Correct: {Array.isArray(q.answer) ? q.answer.join(' / ') : q.answer}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button onClick={startQuiz} className="btn-primary">Take Another Quiz</button>
        </div>
      </div>
    )
  }

  return (
    <div className="civics-quiz">
      <div className="quiz-progress">
        <p>Question {currentIndex + 1} of {currentQuiz.length}</p>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${((currentIndex + 1) / currentQuiz.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="quiz-question">
        <h3>{currentQuestion.question}</h3>

        <div className="answer-options">
          {currentQuestion.options.map(option => (
            <button
              key={option.id}
              onClick={() => handleAnswerSelect(option)}
              className={`option-button ${
                selectedAnswer?.id === option.id ? 'selected' : ''
              } ${
                isAnswered && option.isCorrect ? 'correct' : ''
              } ${
                isAnswered && selectedAnswer?.id === option.id && !option.isCorrect ? 'incorrect' : ''
              }`}
              disabled={isAnswered}
            >
              {option.text}
            </button>
          ))}
        </div>

        {isAnswered && (
          <div className={`feedback ${selectedAnswer.isCorrect ? 'correct-feedback' : 'incorrect-feedback'}`}>
            {selectedAnswer.isCorrect ? (
              <p>✅ Correct!</p>
            ) : (
              <div>
                <p>❌ Incorrect</p>
                <p>Correct answer: {Array.isArray(currentQuestion.answer) ? currentQuestion.answer.join(' / ') : currentQuestion.answer}</p>
              </div>
            )}
          </div>
        )}

        <div className="quiz-actions">
          {!isAnswered ? (
            <button 
              onClick={handleSubmitAnswer} 
              disabled={!selectedAnswer}
              className="btn-primary"
            >
              Submit Answer
            </button>
          ) : (
            <button onClick={handleNextQuestion} className="btn-primary">
              {currentIndex < currentQuiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          )}
        </div>
      </div>

      <div className="current-score">
        Current Score: {score}/{currentIndex + (isAnswered ? 1 : 0)}
      </div>
    </div>
  )
}
