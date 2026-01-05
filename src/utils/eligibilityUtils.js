// Eligibility calculation engine
import {
  differenceInDays,
  differenceInMonths,
  addDays,
  addYears,
  addMonths,
  subYears,
  subDays,
  parseISO,
  isAfter,
  isBefore,
} from 'date-fns'

// Public API
export function calculateEligibility(profile, trips, asOfDate = new Date()) {
  if (!profile) {
    return {
      eligible: false,
      blockers: ['No profile configured'],
      warnings: [],
      metrics: {},
      earliestFilingDate: null,
      lowerRiskFilingDate: null,
    }
  }

  const lprDate = parseISO(profile.lprDate)
  const dob = parseISO(profile.dob)
  const stateResidenceDate = parseISO(profile.stateResidenceDate)
  const eligibilityPath = profile.eligibilityPath || '5-year'

  const blockers = []
  const warnings = []
  const metrics = {}

  // 1) Age requirement (18+ at asOfDate)
  const ageAtFiling = differenceInYears(asOfDate, dob)
  metrics.age = { current: ageAtFiling, required: 18, met: ageAtFiling >= 18 }
  if (ageAtFiling < 18) blockers.push(`Must be 18 years old (currently ${ageAtFiling})`)

  // 2) Green card time (5y/3y, with 90-day early filing)
  const requiredYears = eligibilityPath === '3-year-spouse' ? 3 : 5
  const earlyFilingDays = 90
  const targetDate = addYears(lprDate, requiredYears)
  const earlyFilingDate = addDays(targetDate, -earlyFilingDays)
  const daysAsLPR = differenceInDays(asOfDate, lprDate)
  const daysRequired = requiredYears * 365

  metrics.greenCardTime = {
    daysSinceLPR: daysAsLPR,
    daysRequired,
    targetDate: targetDate.toISOString(),
    earlyFilingDate: earlyFilingDate.toISOString(),
    met: !isBefore(asOfDate, earlyFilingDate), // inclusive
  }

  if (isBefore(asOfDate, earlyFilingDate)) {
    const daysRemaining = differenceInDays(earlyFilingDate, asOfDate)
    blockers.push(
      `Need ${daysRemaining} more days as LPR (eligible on ${earlyFilingDate.toLocaleDateString()})`
    )
  }

  // 3) State/district residence (90 days)
  const daysInState = differenceInDays(asOfDate, stateResidenceDate)
  const stateEligibleDate = addDays(stateResidenceDate, 90)

  metrics.stateResidence = {
    days: daysInState,
    required: 90,
    met: daysInState >= 90,
    state: profile.state,
    eligibleDate: stateEligibleDate.toISOString(),
  }

  if (daysInState < 90) {
    const remaining = 90 - daysInState
    blockers.push(
      `Need ${remaining} more days in ${profile.state} (eligible on ${stateEligibleDate.toLocaleDateString()})`
    )
  }

  // 4) Absences / continuous residence analysis + recovery dates (two-date model with rolling window)
  const absenceAnalysis = analyzeAbsences(trips, lprDate, asOfDate, requiredYears, eligibilityPath)
  metrics.absences = absenceAnalysis

  if (absenceAnalysis.continuityBroken) {
    blockers.push('Continuous residence broken by absence of 1+ year')
  }
  absenceAnalysis.warnings.forEach(w => warnings.push(w))

  // 5) Physical presence (913 days in last 5 years; 548 in last 3 years)
  const physicalPresence = calculatePhysicalPresence(trips, asOfDate, eligibilityPath)
  metrics.physicalPresence = physicalPresence

  if (!physicalPresence.met) {
    blockers.push(
      `Need ${physicalPresence.shortage} more days of physical presence in the US (requires ${physicalPresence.requiredDaysInUS} days in last ${physicalPresence.windowYears} years)`
    )
  }

  // Earliest dates (combine constraints)
  // Base constraints: early filing date + state 90-day date
  let earliestPossibleFilingDate = maxDate(earlyFilingDate, stateEligibleDate)
  let lowerRiskFilingDate = maxDate(earlyFilingDate, stateEligibleDate)

  // Add continuity recovery constraints (5-year mode only; may be null)
  if (absenceAnalysis.earliestPossibleAfterContinuityIssue) {
    earliestPossibleFilingDate = maxDate(
      earliestPossibleFilingDate,
      parseISO(absenceAnalysis.earliestPossibleAfterContinuityIssue)
    )
  }
  if (absenceAnalysis.lowerRiskAfterContinuityIssue) {
    lowerRiskFilingDate = maxDate(
      lowerRiskFilingDate,
      parseISO(absenceAnalysis.lowerRiskAfterContinuityIssue)
    )
  } else {
    // If there's no 6–12 month continuity issue, don't show a separate lower-risk date
    lowerRiskFilingDate = null
  }

  return {
    eligible: blockers.length === 0,
    blockers,
    warnings,
    metrics,
    earliestFilingDate: earliestPossibleFilingDate ? earliestPossibleFilingDate.toISOString() : null,
    lowerRiskFilingDate: lowerRiskFilingDate ? lowerRiskFilingDate.toISOString() : null,
  }
}

/**
 * Absence / continuity analysis with ROLLING 5-YEAR WINDOW logic:
 * - ≥365 days => continuity broken + compute recovery date (return + 4y + 1d)
 *   AND rolling-window date (tripEnd + 5y - 179d)
 * - >180 and <365 => continuity risk + compute:
 *   - earliestPossibleAfterContinuityIssue = return + 4y + 1d (fileable with rebuttal)
 *   - lowerRiskAfterContinuityIssue = tripEnd + 5y - 179d (when trip is <180 days in lookback)
 */
function analyzeAbsences(trips, lprDate, asOfDate, requiredYears, eligibilityPath) {
  const relevantTrips = trips
    .map(t => ({
      ...t,
      start: parseISO(t.startDate),
      end: parseISO(t.endDate),
      days: differenceInDays(parseISO(t.endDate), parseISO(t.startDate)),
    }))
    .filter(t => t.countAsAbsence !== false)

  // Only count trips that overlap the [lprDate, asOfDate] window
  const windowStart = lprDate
  const windowEnd = asOfDate

  const tripsInWindow = relevantTrips.filter(t =>
    overlaps(t.start, t.end, windowStart, windowEnd)
  )

  const warnings = []
  let continuityBroken = false

  // Only compute "recovery" dates for 5-year path per your request
  let earliestPossibleAfterContinuityIssue = null
  let lowerRiskAfterContinuityIssue = null

  tripsInWindow.forEach(trip => {
    if (trip.days >= 365) {
      continuityBroken = true
      warnings.push(
        `Trip to ${trip.destination || 'unknown'} (${trip.start.toLocaleDateString()}) was ${trip.days} days (≥ 1 year) - breaks continuous residence`
      )

      if (eligibilityPath === '5-year') {
        // Earliest possible (with evidence of preserved ties): return + 4y + 1d
        const earliest = addDays(addYears(trip.end, 4), 1)
        earliestPossibleAfterContinuityIssue = maxDate(earliestPossibleAfterContinuityIssue, earliest)

        // Lower-risk (rolling window): first date when trip is ≤179 days in lookback
        // This applies to ALL long trips, even ≥1 year
        const lowerRisk = subDays(addYears(trip.end, 5), 179)
        lowerRiskAfterContinuityIssue = maxDate(lowerRiskAfterContinuityIssue, lowerRisk)
      }
    } else if (trip.days > 180 && trip.days < 365) {
      warnings.push(
        `Trip to ${trip.destination || 'unknown'} (${trip.start.toLocaleDateString()}) was ${trip.days} days (> 6 months) - may affect continuous residence`
      )

      if (eligibilityPath === '5-year') {
        // Earliest possible (with rebuttal burden): return + 4y + 1d
        const earliest = addDays(addYears(trip.end, 4), 1)
        earliestPossibleAfterContinuityIssue = maxDate(earliestPossibleAfterContinuityIssue, earliest)

        // Lower-risk (rolling window): first date when trip is ≤179 days in lookback
        // Formula: tripEnd + 5 years - 179 days
        const lowerRisk = subDays(addYears(trip.end, 5), 179)
        lowerRiskAfterContinuityIssue = maxDate(lowerRiskAfterContinuityIssue, lowerRisk)
      }
    }
  })

  const totalDaysAbsent = tripsInWindow.reduce((sum, t) => sum + t.days, 0)

  return {
    totalTrips: tripsInWindow.length,
    totalDaysAbsent,
    continuityBroken,
    warnings,
    longAbsences: tripsInWindow.filter(t => t.days >= 180),
    earliestPossibleAfterContinuityIssue: earliestPossibleAfterContinuityIssue
      ? earliestPossibleAfterContinuityIssue.toISOString()
      : null,
    lowerRiskAfterContinuityIssue: lowerRiskAfterContinuityIssue
      ? lowerRiskAfterContinuityIssue.toISOString()
      : null,
  }
}

/**
 * Physical presence:
 * - 5-year: require 913 days in last 5 years
 * - 3-year: require 548 days in last 3 years
 */
function calculatePhysicalPresence(trips, asOfDate, eligibilityPath) {
  const windowYears = eligibilityPath === '3-year-spouse' ? 3 : 5
  const requiredDaysInUS = eligibilityPath === '3-year-spouse' ? 548 : 913

  const windowStart = subYears(asOfDate, windowYears)
  const windowEnd = asOfDate
  const totalDays = differenceInDays(windowEnd, windowStart)

  const daysAbroad = trips
    .filter(t => t.countAsAbsence !== false)
    .map(t => ({ start: parseISO(t.startDate), end: parseISO(t.endDate) }))
    .filter(t => isAfter(t.end, windowStart) && isBefore(t.start, windowEnd))
    .reduce((sum, t) => {
      const tripStart = isBefore(t.start, windowStart) ? windowStart : t.start
      const tripEnd = isAfter(t.end, windowEnd) ? windowEnd : t.end
      return sum + differenceInDays(tripEnd, tripStart)
    }, 0)

  const daysInUS = totalDays - daysAbroad
  const met = daysInUS >= requiredDaysInUS
  const shortage = met ? 0 : requiredDaysInUS - daysInUS

  return {
    daysInUS,
    daysAbroad,
    totalDays,
    windowYears,
    requiredDaysInUS,
    met,
    shortage,
    percentOfRequirement: requiredDaysInUS > 0 ? (daysInUS / requiredDaysInUS) * 100 : 0,
  }
}

// Helpers
function overlaps(aStart, aEnd, bStart, bEnd) {
  // Two date ranges overlap if: start1 <= end2 AND end1 >= start2
  return aStart <= bEnd && aEnd >= bStart
}

function maxDate(a, b) {
  if (!a) return b
  if (!b) return a
  return isAfter(a, b) ? a : b
}

function differenceInYears(later, earlier) {
  const months = differenceInMonths(later, earlier)
  return Math.floor(months / 12)
}
