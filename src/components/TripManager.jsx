import React, { useState } from 'react'
import { format, parseISO, differenceInDays, isValid } from 'date-fns'

export default function TripManager({ trips, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    destination: '',
    countAsAbsence: true,
  })
  const [csvText, setCsvText] = useState('')
  const [destinationInput, setDestinationInput] = useState('')

  const resetForm = () => {
    setEditingId(null)
    setFormData({ startDate: '', endDate: '', destination: '', countAsAbsence: true })
    setDestinationInput('')
  }

  // Parse destinations as array (comma-separated)
  const getDestinations = (destString) => {
    if (!destString) return []
    return destString.split(',').map(d => d.trim()).filter(Boolean)
  }

  const addDestination = () => {
    if (!destinationInput.trim()) return
    
    const current = getDestinations(formData.destination)
    if (current.includes(destinationInput.trim())) {
      alert('This destination is already added')
      return
    }
    
    const updated = [...current, destinationInput.trim()].join(', ')
    setFormData({ ...formData, destination: updated })
    setDestinationInput('')
  }

  const removeDestination = (dest) => {
    const current = getDestinations(formData.destination)
    const updated = current.filter(d => d !== dest).join(', ')
    setFormData({ ...formData, destination: updated })
  }

  const handleAdd = () => {
    if (!formData.startDate || !formData.endDate) {
      alert('Please fill start and end dates')
      return
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert('End date must be after start date')
      return
    }

    const newTrip = { id: Date.now(), ...formData }
    onUpdate([...trips, newTrip])
    resetForm()
  }

  const handleUpdate = (id) => {
    if (!formData.startDate || !formData.endDate) {
      alert('Please fill start and end dates')
      return
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert('End date must be after start date')
      return
    }

    const updated = trips.map(t => (t.id === id ? { ...t, ...formData } : t))
    onUpdate(updated)
    resetForm()
  }

  const handleDelete = (id) => {
    if (confirm('Delete this trip?')) {
      onUpdate(trips.filter(t => t.id !== id))
    }
  }

  const handleEdit = (trip) => {
    setEditingId(trip.id)
    setFormData({
      startDate: trip.startDate,
      endDate: trip.endDate,
      destination: trip.destination || '',
      countAsAbsence: trip.countAsAbsence !== false,
    })
    setDestinationInput('')
  }

  // ---- Robust CSV import (prevents date-fns "Invalid time value" crashes) ----
  const normalizeCSVCell = (s) =>
    (s ?? '').toString().trim().replace(/^"(.*)"$/, '$1')

  const isISODateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s)

  const parseCountFlag = (s) => {
    const v = normalizeCSVCell(s).toLowerCase()
    if (v === '' || v === 'true' || v === 'yes' || v === '1') return true
    if (v === 'false' || v === 'no' || v === '0') return false
    return true
  }

  const handleCSVImport = () => {
    try {
      const lines = csvText
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)

      if (lines.length === 0) {
        alert('CSV is empty')
        return
      }

      const rows = lines.map(line => line.split(',').map(normalizeCSVCell))

      const firstRowLower = rows[0].map(c => c.toLowerCase())
      const hasHeader =
        firstRowLower.some(c => c.includes('start')) ||
        firstRowLower.some(c => c.includes('end'))

      const dataRows = hasHeader ? rows.slice(1) : rows

      const newTrips = []
      const errors = []

      dataRows.forEach((cols, idx) => {
        const startDateRaw = cols[0] || ''
        const endDateRaw = cols[1] || ''
        const destination = cols[2] || ''
        const countAsAbsence = parseCountFlag(cols[3])

        if (!isISODateOnly(startDateRaw) || !isISODateOnly(endDateRaw)) {
          errors.push(
            `Row ${idx + 1}: dates must be YYYY-MM-DD (got "${startDateRaw}" and "${endDateRaw}")`
          )
          return
        }

        const start = parseISO(startDateRaw)
        const end = parseISO(endDateRaw)

        if (!isValid(start) || !isValid(end)) {
          errors.push(`Row ${idx + 1}: invalid date value`)
          return
        }

        if (end < start) {
          errors.push(`Row ${idx + 1}: endDate before startDate`)
          return
        }

        newTrips.push({
          id: Date.now() + idx,
          startDate: startDateRaw,
          endDate: endDateRaw,
          destination,
          countAsAbsence,
        })
      })

      onUpdate([...trips, ...newTrips])
      setCsvText('')

      if (errors.length) {
        alert(
          `Imported ${newTrips.length} trips. Skipped ${errors.length} row(s):\n\n` +
            errors.slice(0, 12).join('\n') +
            (errors.length > 12 ? '\n\n(Showing first 12 errors)' : '')
        )
      } else {
        alert(`Imported ${newTrips.length} trips`)
      }
    } catch (e) {
      alert('CSV parsing failed: ' + e.message)
    }
  }

  const sortedTrips = [...trips].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))

  return (
    <div className="trip-manager">
      <h2>Travel History</h2>

      <div className="trip-form">
        <h3>{editingId ? 'Edit Trip' : 'Add New Trip'}</h3>
        <div className="form-row">
          <input
            type="date"
            placeholder="Start Date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <input
            type="date"
            placeholder="End Date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
          
          <div className="destination-input-group">
            <input
              type="text"
              placeholder="Add country (e.g., France)"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addDestination()
                }
              }}
            />
            <button 
              type="button" 
              onClick={addDestination}
              className="btn-add-destination"
            >
              + Add
            </button>
          </div>

          {getDestinations(formData.destination).length > 0 && (
            <div className="destination-tags">
              {getDestinations(formData.destination).map((dest, i) => (
                <span key={i} className="destination-tag">
                  {dest}
                  <button
                    type="button"
                    onClick={() => removeDestination(dest)}
                    className="remove-tag"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <label>
            <input
              type="checkbox"
              checked={formData.countAsAbsence}
              onChange={(e) => setFormData({ ...formData, countAsAbsence: e.target.checked })}
            />
            Count as absence
          </label>

          {editingId ? (
            <>
              <button onClick={() => handleUpdate(editingId)}>Update</button>
              <button onClick={resetForm}>Cancel</button>
            </>
          ) : (
            <button onClick={handleAdd}>Add Trip</button>
          )}
        </div>
      </div>

      <div className="csv-import">
        <h3>Bulk Import (CSV)</h3>
        <p>Format: startDate,endDate,destination,countAsAbsence</p>
        <p>
          Dates must be ISO format: <code>YYYY-MM-DD</code>. For multiple countries, use quotes: <code>"France, Germany"</code>
        </p>
        <textarea
          placeholder={'startDate,endDate,destination,countAsAbsence\n2023-01-15,2023-01-30,"France, Germany",true'}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={6}
        />
        <button onClick={handleCSVImport}>Import CSV</button>
      </div>

      <div className="trip-list">
        <h3>Trips ({trips.length})</h3>
        {sortedTrips.length === 0 ? (
          <p>No trips recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Destination(s)</th>
                <th>Counts?</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrips.map(trip => {
                const start = parseISO(trip.startDate)
                const end = parseISO(trip.endDate)

                if (!isValid(start) || !isValid(end)) {
                  return (
                    <tr key={trip.id} className="warning-row">
                      <td colSpan={6}>
                        Invalid trip dates: "{trip.startDate}" → "{trip.endDate}"
                      </td>
                    </tr>
                  )
                }

                const days = differenceInDays(end, start)
                const isLong = days >= 180
                const destinations = getDestinations(trip.destination)

                return (
                  <tr key={trip.id} className={isLong ? 'warning-row' : ''}>
                    <td>{format(start, 'MMM d, yyyy')}</td>
                    <td>{format(end, 'MMM d, yyyy')}</td>
                    <td>
                      {days}
                      {days >= 365 && ' 🚫'}
                      {days >= 180 && days < 365 && ' ⚠️'}
                    </td>
                    <td>
                      {destinations.length > 0 ? (
                        <div className="destination-tags-display">
                          {destinations.map((dest, i) => (
                            <span key={i} className="destination-pill">{dest}</span>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td>{trip.countAsAbsence !== false ? 'Yes' : 'No'}</td>
                    <td>
                      <button onClick={() => handleEdit(trip)}>Edit</button>
                      <button onClick={() => handleDelete(trip.id)}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
