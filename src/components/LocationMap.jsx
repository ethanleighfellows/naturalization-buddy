import React, { useMemo } from 'react'
import { parseISO, differenceInDays } from 'date-fns'

export default function LocationMap({ trips }) {
  const locationData = useMemo(() => {
    const countryDays = {}

    trips.forEach(trip => {
      if (!trip.destination || trip.countAsAbsence === false) return

      const country = trip.destination.split(',')[0].trim()
      const days = differenceInDays(parseISO(trip.endDate), parseISO(trip.startDate))

      if (!countryDays[country]) {
        countryDays[country] = {
          totalDays: 0,
          trips: []
        }
      }

      countryDays[country].totalDays += days
      countryDays[country].trips.push({
        start: trip.startDate,
        end: trip.endDate,
        days
      })
    })

    return Object.entries(countryDays)
      .map(([country, data]) => ({
        country,
        ...data
      }))
      .sort((a, b) => b.totalDays - a.totalDays)
  }, [trips])

  const totalDaysAbroad = locationData.reduce((sum, loc) => sum + loc.totalDays, 0)

  return (
    <div className="location-map">
      <h2>Days by Location</h2>

      <div className="map-summary">
        <p><strong>Total days abroad:</strong> {totalDaysAbroad}</p>
        <p><strong>Countries visited:</strong> {locationData.length}</p>
      </div>

      <div className="location-list">
        <h3>Breakdown by Country</h3>
        {locationData.length === 0 ? (
          <p>No travel data to display. Add trips to see your location breakdown.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Total Days</th>
                <th>Number of Trips</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {locationData.map(loc => (
                <tr key={loc.country}>
                  <td><strong>{loc.country}</strong></td>
                  <td>{loc.totalDays}</td>
                  <td>{loc.trips.length}</td>
                  <td>
                    <details>
                      <summary>View trips</summary>
                      <ul className="trip-details">
                        {loc.trips.map((t, idx) => (
                          <li key={idx}>
                            {t.start} to {t.end} ({t.days} days)
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="map-visualization">
        <h3>Visual Breakdown</h3>
        <div className="bar-chart">
          {locationData.slice(0, 10).map(loc => (
            <div key={loc.country} className="bar-item">
              <div className="bar-label">{loc.country}</div>
              <div className="bar-container">
                <div 
                  className="bar-fill"
                  style={{ 
                    width: `${(loc.totalDays / Math.max(...locationData.map(l => l.totalDays))) * 100}%` 
                  }}
                  title={`${loc.totalDays} days`}
                >
                  <span className="bar-value">{loc.totalDays} days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="map-note">
        <p>
          <strong>Note:</strong> This view shows countries where you spent time based on your trip records.
          For the naturalization application, you may need to provide additional documentation for 
          trips exceeding 180 days.
        </p>
      </div>
    </div>
  )
}
