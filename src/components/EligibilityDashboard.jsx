import React, { useState, useMemo } from 'react'
import { calculateEligibility } from '../utils/eligibilityUtils'
import { format, parseISO, addDays } from 'date-fns'

export default function EligibilityDashboard({ profile, trips }) {
  const [scenarioMode, setScenarioMode] = useState('today')
  const [futureDate, setFutureDate] = useState('')

  const asOfDate = scenarioMode === 'future' && futureDate 
    ? parseISO(futureDate) 
    : new Date()

  const eligibility = useMemo(
    () => calculateEligibility(profile, trips, asOfDate),
    [profile, trips, asOfDate]
  )

  if (!profile) {
    return <div>Please set up your profile first.</div>
  }

  const { eligible, blockers, warnings, metrics, earliestFilingDate } = eligibility

  return (
    <div className="eligibility-dashboard">
      <div className="scenario-toggle">
        <label>
          <input
            type="radio"
            value="today"
            checked={scenarioMode === 'today'}
            onChange={(e) => setScenarioMode(e.target.value)}
          />
          As of Today
        </label>
        <label>
          <input
            type="radio"
            value="future"
            checked={scenarioMode === 'future'}
            onChange={(e) => setScenarioMode(e.target.value)}
          />
          Future Date
        </label>
        {scenarioMode === 'future' && (
          <input
            type="date"
            value={futureDate}
            onChange={(e) => setFutureDate(e.target.value)}
          />
        )}
      </div>

      <div className={`status-card ${eligible ? 'eligible' : 'not-eligible'}`}>
        <h2>{eligible ? '✅ Eligible to File!' : '⏳ Not Yet Eligible'}</h2>
        {!eligible && earliestFilingDate && (
          <p className="earliest-date">
            Earliest recommended filing: {format(parseISO(earliestFilingDate), 'MMMM d, yyyy')}
          </p>
        )}
      </div>

      {blockers.length > 0 && (
        <div className="blockers-section">
          <h3>🚫 Hard Blockers</h3>
          <ul>
            {blockers.map((blocker, i) => (
              <li key={i}>{blocker}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="warnings-section">
          <h3>⚠️ Warnings</h3>
          <ul>
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="metrics-grid">
        {/* Age */}
        <div className="metric-card">
          <h4>Age Requirement</h4>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ width: `${Math.min(100, (metrics.age.current / metrics.age.required) * 100)}%` }}
            />
          </div>
          <p>
            {metrics.age.current} years old 
            {metrics.age.met ? ' ✓' : ` (need ${metrics.age.required})`}
          </p>
        </div>

        {/* Green card time */}
        <div className="metric-card">
          <h4>Green Card Time</h4>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ 
                width: `${Math.min(100, (metrics.greenCardTime.daysSinceLPR / metrics.greenCardTime.daysRequired) * 100)}%` 
              }}
            />
          </div>
          <p>
            {metrics.greenCardTime.daysSinceLPR} / {metrics.greenCardTime.daysRequired} days
            {metrics.greenCardTime.met ? ' ✓' : ''}
          </p>
          <small>Early filing from: {format(parseISO(metrics.greenCardTime.earlyFilingDate), 'MMM d, yyyy')}</small>
        </div>

        {/* State residence */}
        <div className="metric-card">
          <h4>State Residence ({metrics.stateResidence.state})</h4>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ width: `${Math.min(100, (metrics.stateResidence.days / metrics.stateResidence.required) * 100)}%` }}
            />
          </div>
          <p>
            {metrics.stateResidence.days} / {metrics.stateResidence.required} days
            {metrics.stateResidence.met ? ' ✓' : ''}
          </p>
        </div>

        {/* Physical presence */}
        <div className="metric-card">
          <h4>Physical Presence</h4>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ 
                width: `${metrics.physicalPresence.percentInUS}%` 
              }}
            />
          </div>
          <p>
            {metrics.physicalPresence.daysInUS} days in US ({metrics.physicalPresence.percentInUS}%)
          </p>
          <small>{metrics.physicalPresence.daysAbroad} days abroad</small>
        </div>

        {/* Absences */}
        <div className="metric-card">
          <h4>Travel Record</h4>
          <p>Total trips: {metrics.absences.totalTrips}</p>
          <p>Total days absent: {metrics.absences.totalDaysAbsent}</p>
          {metrics.absences.longAbsences.length > 0 && (
            <p className="warning-text">
              {metrics.absences.longAbsences.length} trip(s) ≥ 180 days
            </p>
          )}
          {metrics.absences.continuityBroken && (
            <p className="error-text">Continuity broken!</p>
          )}
        </div>
      </div>

      <div className="what-changed">
        <h3>📋 Current Status Summary</h3>
        <ul>
          <li>Eligibility path: {profile.eligibilityPath === '3-year-spouse' ? '3-year (spouse of US citizen)' : '5-year (general)'}</li>
          <li>LPR since: {format(parseISO(profile.lprDate), 'MMMM d, yyyy')}</li>
          <li>Current state: {profile.state} (since {format(parseISO(profile.stateResidenceDate), 'MMMM d, yyyy')})</li>
          <li>Trips logged: {trips.length}</li>
        </ul>
      </div>
    </div>
  )
}
