import React, { useState } from 'react'
import { format, parseISO, differenceInDays } from 'date-fns'

export default function TripManager({ trips, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    destination: '',
    countAsAbsence: true
  })
  const [csvText, setCsvText] = useState('')

  const handleAdd = () => {
    if (!formData.startDate || !formData.endDate) {
      alert('Please fill start and end dates')
      return
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert('End date must be after start date')
      return
    }

    const newTrip = {
      id: Date.now(),
      ...formData
    }

    onUpdate([...trips, newTrip])
    setFormData({ startDate: '', endDate: '', destination: '', countAsAbsence: true })
  }

  const handleUpdate = (id) => {
    const updated = trips.map(t => 
      t.id === id ? { ...t, ...formData } : t
    )
    onUpdate(updated)
    setEditingId(null)
    setFormData({ startDate: '', endDate: '', destination: '', countAsAbsence: true })
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
      countAsAbsence: trip.countAsAbsence !== false
    })
  }

  const handleCSVImport = () => {
    try {
      const lines = csvText.trim().split('\n')
      const header = lines[0].toLowerCase()

      if (!header.includes('start') || !header.includes('end')) {
        alert('CSV must have startDate and endDate columns')
        return
      }

      const newTrips = lines.slice(1).map((line, idx) => {
        const parts = line.split(',')
        return {
          id: Date.now() + idx,
          startDate: parts[0].trim(),
          endDate: parts[1].trim(),
          destination: parts[2]?.trim() || '',
          countAsAbsence: parts[3]?.trim().toLowerCase() !== 'false'
        }
      })

      onUpdate([...trips, ...newTrips])
      setCsvText('')
      alert(`Imported ${newTrips.length} trips`)
    } catch (e) {
      alert('CSV parsing failed: ' + e.message)
    }
  }

  const sortedTrips = [...trips].sort((a, b) => 
    new Date(b.startDate) - new Date(a.startDate)
  )

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
          <input
            type="text"
            placeholder="Destination (e.g., Mexico, France)"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          />
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
              <button onClick={() => {
                setEditingId(null)
                setFormData({ startDate: '', endDate: '', destination: '', countAsAbsence: true })
              }}>Cancel</button>
            </>
          ) : (
            <button onClick={handleAdd}>Add Trip</button>
          )}
        </div>
      </div>

      <div className="csv-import">
        <h3>Bulk Import (CSV)</h3>
        <p>Format: startDate,endDate,destination,countAsAbsence</p>
        <textarea
          placeholder="2023-01-15,2023-01-30,Mexico,true"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={4}
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
                <th>Destination</th>
                <th>Counts?</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrips.map(trip => {
                const days = differenceInDays(
                  parseISO(trip.endDate), 
                  parseISO(trip.startDate)
                )
                const isLong = days >= 180

                return (
                  <tr key={trip.id} className={isLong ? 'warning-row' : ''}>
                    <td>{format(parseISO(trip.startDate), 'MMM d, yyyy')}</td>
                    <td>{format(parseISO(trip.endDate), 'MMM d, yyyy')}</td>
                    <td>
                      {days}
                      {days >= 365 && ' 🚫'}
                      {days >= 180 && days < 365 && ' ⚠️'}
                    </td>
                    <td>{trip.destination || '—'}</td>
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
