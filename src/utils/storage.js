import { openDB } from 'idb'

const DB_NAME = 'naturalization-tracker'
const DB_VERSION = 1

export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile')
      }
      if (!db.objectStoreNames.contains('trips')) {
        db.createObjectStore('trips')
      }
      if (!db.objectStoreNames.contains('civics-progress')) {
        db.createObjectStore('civics-progress')
      }
    },
  })
  return db
}

export async function saveProfile(profile) {
  const db = await openDB(DB_NAME, DB_VERSION)
  await db.put('profile', profile, 'current')
}

export async function loadProfile() {
  const db = await openDB(DB_NAME, DB_VERSION)
  return await db.get('profile', 'current')
}

export async function saveTrips(trips) {
  const db = await openDB(DB_NAME, DB_VERSION)
  await db.put('trips', trips, 'all')
}

export async function loadTrips() {
  const db = await openDB(DB_NAME, DB_VERSION)
  const trips = await db.get('trips', 'all')
  return trips || []
}

export async function saveCivicsProgress(progress) {
  const db = await openDB(DB_NAME, DB_VERSION)
  await db.put('civics-progress', progress, 'history')
}

export async function loadCivicsProgress() {
  const db = await openDB(DB_NAME, DB_VERSION)
  const progress = await db.get('civics-progress', 'history')
  return progress || { attempts: [] }
}
