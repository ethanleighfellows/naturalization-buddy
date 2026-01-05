import React, { useState, useEffect } from 'react'
import { CIVICS_QUESTIONS } from '../utils/civicsQuestions'
import { saveCivicsProgress, loadCivicsProgress } from '../utils/storage'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function CivicsTest() {
  const [mode, setMode] = useState('menu')
  const [currentQuiz, setCurrentQuiz] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [progress, setProgress] = useState({ attempts: [] })
  const [currentAttempt, setCurrentAttempt] = useState(null)

  useEffect(() => {
    loadCivicsProgress().then(p => setProgress(p))
  }, [])

  const startQuiz = (quizMode) => {
    let questions = []

    if (quizMode === 'random') {
      questions = [...CIVICS_QUESTIONS]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
    } else if (quizMode === 'weak') {
      const weakCategories = getWeakCategories()
      const weakQuestions = CIVICS_QUESTIONS.filter(q => 
        weakCategories.includes(q.category)
      )
      questions = [...weakQuestions]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
    }

    setCurrentQuiz(questions)
    setCurrentIndex(0)
    setMode('quiz')
    setShowAnswer(false)
    setCurrentAttempt({
      startTime: Date.now(),
      questions: questions.map(q => ({
        questionId: q.id,
        question: q.question,
        category: q.category,
        userAnswer: null,
        correct: null,
        timeSpent: 0
      }))
    })
  }

  const getWeakCategories = () => {
    if (progress.attempts.length === 0) return []

    const categoryStats = {}
    progress.attempts.forEach(attempt => {
      attempt.questions.forEach(q => {
        if (!categoryStats[q.category]) {
          categoryStats[q.category] = { correct: 0, total: 0 }
        }
        categoryStats[q.category].total++
        if (q.correct) categoryStats[q.category].correct++
      })
    })

    return Object.entries(categoryStats)
      .filter(([_, stats]) => stats.total > 0)
      .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
      .slice(0, 3)
      .map(([cat, _]) => cat)
  }

  const checkAnswer = () => {
    const question = currentQuiz[currentIndex]
    const normalized = userAnswer.toLowerCase().trim()
    const correct = question.acceptableAnswers.some(ans => 
      normalized.includes(ans.toLowerCase())
    )

    setCurrentAttempt(prev => {
      const updated = { ...prev }
      updated.questions[currentIndex].userAnswer = userAnswer
      updated.questions[currentIndex].correct = correct
      updated.questions[currentIndex].timeSpent = Date.now() - prev.startTime
      return updated
    })

    setShowAnswer(true)
  }

  const nextQuestion = () => {
    if (currentIndex < currentQuiz.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setUserAnswer('')
      setShowAnswer(false)
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = async () => {
    const completed = {
      ...currentAttempt,
      endTime: Date.now(),
      totalCorrect: currentAttempt.questions.filter(q => q.correct).length
    }

    const updated = {
      attempts: [...progress.attempts, completed]
    }

    setProgress(updated)
    await saveCivicsProgress(updated)
    setMode('results')
  }

  const getCategoryStats = () => {
    const stats = {}
    progress.attempts.forEach(attempt => {
      attempt.questions.forEach(q => {
        if (!stats[q.category]) {
          stats[q.category] = { correct: 0, total: 0 }
        }
        stats[q.category].total++
        if (q.correct) stats[q.category].correct++
      })
    })

    return Object.entries(stats).map(([category, data]) => ({
      category,
      accuracy: data.total > 0 ? ((data.correct / data.total) * 100).toFixed(1) : 0,
      total: data.total
    }))
  }

  if (mode === 'menu') {
    const totalAttempts = progress.attempts.length
    const totalQuestions = progress.attempts.reduce((sum, a) => sum + a.questions.length, 0)
    const totalCorrect = progress.attempts.reduce((sum, a) => sum + a.totalCorrect, 0)
    const overallAccuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : 0

    return (
      <div className="civics-test">
        <h2>Civics Test Practice</h2>

        <div className="stats-overview">
          <h3>Your Progress</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{totalAttempts}</div>
              <div className="stat-label">Attempts</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{overallAccuracy}%</div>
              <div className="stat-label">Overall Accuracy</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalQuestions}</div>
              <div className="stat-label">Questions Answered</div>
            </div>
          </div>
        </div>

        {progress.attempts.length > 0 && (
          <div className="category-breakdown">
            <h3>Accuracy by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getCategoryStats()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="quiz-modes">
          <h3>Start Practice</h3>
          <button onClick={() => startQuiz('random')} className="btn-primary">
            Quick Quiz (10 Random Questions)
          </button>
          <button onClick={() => startQuiz('weak')} className="btn-secondary">
            Weak Area Quiz
          </button>
        </div>

        <div className="readiness-indicator">
          <h3>Readiness Indicator</h3>
          <p>
            The actual test requires 6 out of 10 correct answers to pass.
            {overallAccuracy >= 60 ? (
              <span className="ready"> ✅ You are likely ready!</span>
            ) : (
              <span className="not-ready"> ⚠️ Keep practicing to improve your score.</span>
            )}
          </p>
        </div>
      </div>
    )
  }

  if (mode === 'quiz') {
    const question = currentQuiz[currentIndex]

    return (
      <div className="civics-quiz">
        <div className="quiz-header">
          <h2>Question {currentIndex + 1} of {currentQuiz.length}</h2>
          <p className="category-tag">{question.category}</p>
        </div>

        <div className="question-card">
          <h3>{question.question}</h3>

          {!showAnswer && (
            <>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={3}
              />
              <button onClick={checkAnswer} disabled={!userAnswer.trim()}>
                Check Answer
              </button>
            </>
          )}

          {showAnswer && (
            <>
              <div className={`answer-feedback ${currentAttempt.questions[currentIndex].correct ? 'correct' : 'incorrect'}`}>
                <h4>
                  {currentAttempt.questions[currentIndex].correct ? '✅ Correct!' : '❌ Incorrect'}
                </h4>
                <p><strong>Your answer:</strong> {userAnswer}</p>
                <p><strong>Correct answer:</strong> {question.answer}</p>
              </div>
              <button onClick={nextQuestion}>
                {currentIndex < currentQuiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (mode === 'results') {
    const score = currentAttempt.totalCorrect
    const total = currentAttempt.questions.length
    const passed = score >= 6

    return (
      <div className="quiz-results">
        <h2>Quiz Complete!</h2>

        <div className={`score-card ${passed ? 'passed' : 'failed'}`}>
          <div className="score-big">{score} / {total}</div>
          <p>{passed ? '✅ You passed!' : '❌ Keep practicing'}</p>
        </div>

        <div className="results-detail">
          <h3>Question Review</h3>
          {currentAttempt.questions.map((q, idx) => (
            <div key={idx} className={`result-item ${q.correct ? 'correct' : 'incorrect'}`}>
              <p><strong>Q{idx + 1}:</strong> {q.question}</p>
              <p>Your answer: {q.userAnswer || 'No answer'}</p>
              {!q.correct && <p className="correct-answer-note">Correct: {currentQuiz[idx].answer}</p>}
            </div>
          ))}
        </div>

        <button onClick={() => setMode('menu')}>Back to Menu</button>
      </div>
    )
  }
}
