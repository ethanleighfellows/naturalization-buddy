import React, { useState, useEffect } from 'react'
import { openDB } from 'idb'
import EligibilityDashboard from './components/EligibilityDashboard'
import TripManager from './components/TripManager'
import CivicsTest from './components/CivicsTest'
import DataPackExport from './components/DataPackExport'
import LocationMap from './components/LocationMap'
import ProfileForm from './components/ProfileForm'
import { initDB, saveProfile, loadProfile, saveTrips, loadTrips } from './utils/storage'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [profile, setProfile] = useState(null)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      await initDB()
      const savedProfile = await loadProfile()
      const savedTrips = await loadTrips()

      if (savedProfile) setProfile(savedProfile)
      if (savedTrips) setTrips(savedTrips)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleProfileUpdate = async (newProfile) => {
    setProfile(newProfile)
    await saveProfile(newProfile)
  }

  const handleTripsUpdate = async (newTrips) => {
    setTrips(newTrips)
    await saveTrips(newTrips)
  }

  const wipeAllData = async () => {
    if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      const db = await openDB('naturalization-tracker', 1)
      await db.clear('profile')
      await db.clear('trips')
      await db.clear('civics-progress')
      setProfile(null)
      setTrips([])
      alert('All data has been wiped.')
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🇺🇸 Naturalization Eligibility Tracker</h1>
        <p className="privacy-notice">
          ✓ All data stored locally on your device • No servers • No tracking
        </p>
      </header>

      <nav className="app-nav">
        <button 
          className={currentView === 'dashboard' ? 'active' : ''}
          onClick={() => setCurrentView('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={currentView === 'profile' ? 'active' : ''}
          onClick={() => setCurrentView('profile')}
        >
          Profile & Residence
        </button>
        <button 
          className={currentView === 'trips' ? 'active' : ''}
          onClick={() => setCurrentView('trips')}
        >
          Travel History
        </button>
        <button 
          className={currentView === 'civics' ? 'active' : ''}
          onClick={() => setCurrentView('civics')}
        >
          Civics Test
        </button>
        <button 
          className={currentView === 'map' ? 'active' : ''}
          onClick={() => setCurrentView('map')}
        >
          Location Map
        </button>
        <button 
          className={currentView === 'export' ? 'active' : ''}
          onClick={() => setCurrentView('export')}
        >
          Data Pack
        </button>
      </nav>

      <main className="app-main">
        {!profile && currentView !== 'profile' && (
          <div className="setup-prompt">
            <h2>Welcome!</h2>
            <p>Please set up your profile first to start tracking eligibility.</p>
            <button onClick={() => setCurrentView('profile')}>Set Up Profile</button>
          </div>
        )}

        {(profile || currentView === 'profile') && (
          <>
            {currentView === 'dashboard' && (
              <EligibilityDashboard profile={profile} trips={trips} />
            )}
            {currentView === 'profile' && (
              <ProfileForm profile={profile} onSave={handleProfileUpdate} />
            )}
            {currentView === 'trips' && (
              <TripManager trips={trips} onUpdate={handleTripsUpdate} />
            )}
            {currentView === 'civics' && <CivicsTest />}
            {currentView === 'map' && <LocationMap trips={trips} />}
            {currentView === 'export' && (
              <DataPackExport profile={profile} trips={trips} />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <button onClick={wipeAllData} className="danger-btn">
          Wipe All Data
        </button>
        <p className="disclaimer">
          This tool is for informational purposes only and does not provide legal advice.
          Consult an immigration attorney for personalized guidance.
        </p>
      </footer>
    </div>
  )
}

export default App
