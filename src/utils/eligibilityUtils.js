// Eligibility calculation engine
import { differenceInDays, differenceInMonths, addDays, addYears, parseISO, isAfter, isBefore } from 'date-fns'

export function calculateEligibility(profile, trips, asOfDate = new Date()) {
  if (!profile) {
    return {
      eligible: false,
      blockers: ['No profile configured'],
      warnings: [],
      metrics: {}
    }
  }

  const lprDate = parseISO(profile.lprDate)
  const dob = parseISO(profile.dob)
  const stateResidenceDate = parseISO(profile.stateResidenceDate)
  const eligibilityPath = profile.eligibilityPath || '5-year'

  const blockers = []
  const warnings = []
  const metrics = {}

  // 1. Age requirement (must be 18+)
  const ageAtFiling = differenceInYears(asOfDate, dob)
  metrics.age = {
    current: ageAtFiling,
    required: 18,
    met: ageAtFiling >= 18
  }
  if (ageAtFiling < 18) {
    blockers.push(`Must be 18 years old (currently ${ageAtFiling})`)
  }

  // 2. Green card time (continuous residence window)
  const requiredYears = eligibilityPath === '3-year-spouse' ? 3 : 5
  const earlyFilingDays = 90
  const targetDate = addYears(lprDate, requiredYears)
  const earlyFilingDate = addDays(targetDate, -earlyFilingDays)
  const daysAsLPR = differenceInDays(asOfDate, lprDate)
  const daysRequired = requiredYears * 365

  metrics.greenCardTime = {
    daysSinceLPR: daysAsLPR,
    daysRequired: daysRequired,
    targetDate: targetDate.toISOString(),
    earlyFilingDate: earlyFilingDate.toISOString(),
    met: isAfter(asOfDate, earlyFilingDate) || asOfDate.getTime() === earlyFilingDate.getTime()
  }

  if (isBefore(asOfDate, earlyFilingDate)) {
    const daysRemaining = differenceInDays(earlyFilingDate, asOfDate)
    blockers.push(`Need ${daysRemaining} more days as LPR (eligible on ${earlyFilingDate.toLocaleDateString()})`)
  }

  // 3. State/district residence (3 months)
  const daysinState = differenceInDays(asOfDate, stateResidenceDate)
  metrics.stateResidence = {
    days: daysinState,
    required: 90,
    met: daysinState >= 90,
    state: profile.state
  }

  if (daysinState < 90) {
    const remaining = 90 - daysinState
    blockers.push(`Need ${remaining} more days in ${profile.state} (eligible on ${addDays(stateResidenceDate, 90).toLocaleDateString()})`)
  }

  // 4. Absences / continuous residence
  const absenceAnalysis = analyzeAbsences(trips, lprDate, asOfDate, requiredYears)
  metrics.absences = absenceAnalysis

  if (absenceAnalysis.continuityBroken) {
    blockers.push('Continuous residence broken by absence of 1+ year')
  }

  absenceAnalysis.warnings.forEach(w => warnings.push(w))

  // 5. Physical presence (at least half the required period)
  const physicalPresence = calculatePhysicalPresence(trips, lprDate, asOfDate, requiredYears)
  metrics.physicalPresence = physicalPresence

  const requiredDays = Math.floor(daysRequired / 2)
  if (physicalPresence.daysInUS < requiredDays) {
    const shortage = requiredDays - physicalPresence.daysInUS
    blockers.push(`Need ${shortage} more days of physical presence in the US`)
  }

  // Determine earliest filing date
  let earliestFilingDate = earlyFilingDate
  const stateEligibleDate = addDays(stateResidenceDate, 90)
  if (isAfter(stateEligibleDate, earliestFilingDate)) {
    earliestFilingDate = stateEligibleDate
  }

  return {
    eligible: blockers.length === 0,
    blockers,
    warnings,
    metrics,
    earliestFilingDate: earliestFilingDate.toISOString()
  }
}

function analyzeAbsences(trips, lprDate, asOfDate, requiredYears) {
  const relevantTrips = trips
    .map(t => ({
      ...t,
      start: parseISO(t.startDate),
      end: parseISO(t.endDate),
      days: differenceInDays(parseISO(t.endDate), parseISO(t.startDate))
    }))
    .filter(t => t.countAsAbsence !== false)
    .filter(t => isAfter(t.start, lprDate) || t.start.getTime() === lprDate.getTime())
    .filter(t => isBefore(t.start, asOfDate) || t.start.getTime() === asOfDate.getTime())

  const warnings = []
  let continuityBroken = false

  relevantTrips.forEach(trip => {
    if (trip.days >= 365) {
      continuityBroken = true
    } else if (trip.days >= 180 && trip.days < 365) {
      warnings.push(
        `Trip to ${trip.destination || 'unknown'} (${trip.start.toLocaleDateString()}) was ${trip.days} days - may raise continuity questions`
      )
    }
  })

  const totalDaysAbsent = relevantTrips.reduce((sum, t) => sum + t.days, 0)

  return {
    totalTrips: relevantTrips.length,
    totalDaysAbsent,
    continuityBroken,
    warnings,
    longAbsences: relevantTrips.filter(t => t.days >= 180)
  }
}

function calculatePhysicalPresence(trips, lprDate, asOfDate, requiredYears) {
  const windowStart = lprDate
  const windowEnd = asOfDate
  const totalDays = differenceInDays(windowEnd, windowStart)

  const daysAbroad = trips
    .filter(t => t.countAsAbsence !== false)
    .map(t => ({
      start: parseISO(t.startDate),
      end: parseISO(t.endDate)
    }))
    .filter(t => isAfter(t.end, windowStart) && isBefore(t.start, windowEnd))
    .reduce((sum, t) => {
      const tripStart = isBefore(t.start, windowStart) ? windowStart : t.start
      const tripEnd = isAfter(t.end, windowEnd) ? windowEnd : t.end
      return sum + differenceInDays(tripEnd, tripStart)
    }, 0)

  const daysInUS = totalDays - daysAbroad

  return {
    daysInUS,
    daysAbroad,
    totalDays,
    percentInUS: totalDays > 0 ? (daysInUS / totalDays * 100).toFixed(1) : 0
  }
}

function differenceInYears(later, earlier) {
  const months = differenceInMonths(later, earlier)
  return Math.floor(months / 12)
}
