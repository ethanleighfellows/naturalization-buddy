import React, { useState, useEffect } from 'react'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export default function ProfileForm({ profile, onSave }) {
  const [formData, setFormData] = useState({
    dob: '',
    lprDate: '',
    eligibilityPath: '5-year',
    state: 'CA',
    stateResidenceDate: '',
    ...profile
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (!formData.dob || !formData.lprDate || !formData.stateResidenceDate) {
      alert('Please fill in all required fields')
      return
    }

    if (new Date(formData.lprDate) < new Date(formData.dob)) {
      alert('LPR date cannot be before date of birth')
      return
    }

    if (new Date(formData.stateResidenceDate) < new Date(formData.lprDate)) {
      alert('State residence date cannot be before LPR date')
      return
    }

    onSave(formData)
    alert('Profile saved successfully!')
  }

  return (
    <div className="profile-form">
      <h2>Profile & Residence Information</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="dob">Date of Birth *</label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lprDate">LPR "Resident Since" Date *</label>
          <input
            type="date"
            id="lprDate"
            name="lprDate"
            value={formData.lprDate}
            onChange={handleChange}
            required
          />
          <small>The date on your Green Card</small>
        </div>

        <div className="form-group">
          <label htmlFor="eligibilityPath">Eligibility Path *</label>
          <select
            id="eligibilityPath"
            name="eligibilityPath"
            value={formData.eligibilityPath}
            onChange={handleChange}
          >
            <option value="5-year">5-Year (General)</option>
            <option value="3-year-spouse">3-Year (Spouse of US Citizen)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="state">Current State of Residence *</label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
          >
            {US_STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="stateResidenceDate">State Residence "Moved In" Date *</label>
          <input
            type="date"
            id="stateResidenceDate"
            name="stateResidenceDate"
            value={formData.stateResidenceDate}
            onChange={handleChange}
            required
          />
          <small>When you established residence in this state</small>
        </div>

        <button type="submit" className="btn-primary">
          Save Profile
        </button>
      </form>
    </div>
  )
}
