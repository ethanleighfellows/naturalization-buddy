import React, { useState, useEffect } from 'react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { calculateEligibility } from '../utils/eligibilityUtils'
import { loadCivicsProgress } from '../utils/storage'

export default function DataPackExport({ profile, trips }) {
  const [civicsProgress, setCivicsProgress] = useState({ attempts: [] })

  useEffect(() => {
    loadCivicsProgress().then(p => setCivicsProgress(p))
  }, [])

  const eligibility = calculateEligibility(profile, trips)

  const exportJSON = () => {
    const dataPackage = {
      exportDate: new Date().toISOString(),
      profile,
      trips,
      civicsProgress,
      eligibility
    }

    const blob = new Blob([JSON.stringify(dataPackage, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `naturalization-data-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (confirm('Import this data? Current data will be replaced.')) {
          alert('Import functionality: In production, this would restore the data to your app.')
        }
      } catch (err) {
        alert('Invalid JSON file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const printDataPack = () => {
    window.print()
  }

  return (
    <div className="data-pack-export">
      <div className="no-print">
        <h2>Data Pack Export</h2>
        
        <div className="export-options">
          <h3>Export Options</h3>
          
          <div className="export-buttons">
            <button onClick={printDataPack} className="btn-primary">
              🖨️ Print to PDF
            </button>
            <button onClick={exportJSON} className="btn-secondary">
              💾 Export as JSON
            </button>
          </div>

          <div className="import-section">
            <h3>Import Data</h3>
            <input type="file" accept=".json" onChange={importJSON} />
          </div>
        </div>
      </div>

      <div className="printable-content">
        <header className="print-header">
          <h1>Naturalization Eligibility Data Pack</h1>
          <p>Generated: {format(new Date(), 'MMMM d, yyyy')}</p>
          <p className="disclaimer">
            For personal use only. This document does not constitute legal advice.
          </p>
        </header>

        <section className="print-section">
          <h2>Profile Summary</h2>
          <table className="data-table">
            <tbody>
              <tr>
                <td><strong>Date of Birth</strong></td>
                <td>{format(parseISO(profile.dob), 'MMMM d, yyyy')}</td>
              </tr>
              <tr>
                <td><strong>LPR Since</strong></td>
                <td>{format(parseISO(profile.lprDate), 'MMMM d, yyyy')}</td>
              </tr>
              <tr>
                <td><strong>Eligibility Path</strong></td>
                <td>{profile.eligibilityPath === '3-year-spouse' ? '3-Year (Spouse of US Citizen)' : '5-Year (General)'}</td>
              </tr>
              <tr>
                <td><strong>Current State</strong></td>
                <td>{profile.state}</td>
              </tr>
              <tr>
                <td><strong>State Residence Since</strong></td>
                <td>{format(parseISO(profile.stateResidenceDate), 'MMMM d, yyyy')}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="print-section">
          <h2>Eligibility Status</h2>
          <p className={eligibility.eligible ? 'status-eligible' : 'status-not-eligible'}>
            <strong>{eligibility.eligible ? '✅ ELIGIBLE' : '⏳ NOT YET ELIGIBLE'}</strong>
          </p>
          
          {eligibility.earliestFilingDate && (
            <div style={{ marginTop: '1rem' }}>
              <p><strong>Earliest possible filing:</strong> {format(parseISO(eligibility.earliestFilingDate), 'MMMM d, yyyy')}</p>
              {eligibility.lowerRiskFilingDate && (
                <p><strong>Lower-risk filing date:</strong> {format(parseISO(eligibility.lowerRiskFilingDate), 'MMMM d, yyyy')}</p>
              )}
            </div>
          )}

          {!eligibility.eligible && (
            <>
              <h3>Blockers</h3>
              <ul>
                {eligibility.blockers.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </>
          )}
          {eligibility.warnings.length > 0 && (
            <>
              <h3>Warnings</h3>
              <ul>
                {eligibility.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </>
          )}
          
          <table className="data-table">
            <tbody>
              <tr>
                <td><strong>Days as LPR</strong></td>
                <td>{eligibility.metrics.greenCardTime.daysSinceLPR} / {eligibility.metrics.greenCardTime.daysRequired}</td>
              </tr>
              <tr>
                <td><strong>Days in Current State</strong></td>
                <td>{eligibility.metrics.stateResidence.days} / {eligibility.metrics.stateResidence.required}</td>
              </tr>
              <tr>
                <td><strong>Physical Presence</strong></td>
                <td>
                  {eligibility.metrics.physicalPresence.daysInUS} / {eligibility.metrics.physicalPresence.requiredDaysInUS} days 
                  ({eligibility.metrics.physicalPresence.percentOfRequirement.toFixed(1)}%)
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="print-section">
          <h2>Travel History ({trips.length} trips)</h2>
          <table className="trips-table">
            <thead>
              <tr>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Destination</th>
              </tr>
            </thead>
            <tbody>
              {trips
                .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                .map((trip, i) => {
                  const days = differenceInDays(parseISO(trip.endDate), parseISO(trip.startDate))
                  return (
                    <tr key={i}>
                      <td>{format(parseISO(trip.startDate), 'MMM d, yyyy')}</td>
                      <td>{format(parseISO(trip.endDate), 'MMM d, yyyy')}</td>
                      <td>{days}</td>
                      <td>{trip.destination || '—'}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
