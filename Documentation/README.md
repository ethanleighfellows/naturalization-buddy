# Naturalization Eligibility Tracker

A fully client-side web application for lawful permanent residents (LPRs) to track naturalization eligibility, practice civics tests, and generate printable documentation packets.

## Features

### ✅ Eligibility Dashboard
- **Four timebound metrics tracking:**
  - State/district residence (3-month requirement)
  - Green card continuous residence window with 90-day early filing
  - Absence risk assessment (flags 6+ month and 1+ year trips)
  - Age verification (18+ requirement)
- Real-time progress bars and status indicators
- Scenario modeling (test "what if" with future travel dates)
- Clear distinction between hard blockers and warnings

### 🌍 Travel History Management
- CRUD interface for trip entries
- Bulk CSV import for large datasets
- Automatic validation (date overlap detection, continuity checks)
- Visual flags for absences ≥180 days and ≥365 days
- Handles 1,000+ trips with sub-200ms recomputation

### 📚 Civics Test Practice
- 55+ official USCIS civics questions
- Multiple practice modes:
  - Quick Quiz (10 random questions)
  - Weak Area Quiz (targeted practice)
- Progress tracking with accuracy trends by category
- Readiness indicator (6/10 passing threshold simulation)
- Persistent history across browser sessions

### 🗺️ Location Map & Analytics
- Visual breakdown of days spent by country
- Hover tooltips with trip details
- Choropleth-style bar charts
- Automatic aggregation from trip records

### 📄 Data Pack Export
- Printable PDF packet with:
  - Profile summary
  - Eligibility snapshot
  - Complete trip table with flags
  - Civics practice summary
- JSON export/import for backup and device transfer
- Optional privacy controls (redact personal info)

## Technology Stack

- **Frontend:** React 18 + Vite
- **Storage:** IndexedDB (via `idb` library)
- **Charts:** Recharts
- **Date handling:** date-fns
- **Architecture:** 100% client-side, no backend required

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm

### Quick Start

1. **Extract the project files** into a directory

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

The build output will be in the `dist/` folder, which can be served from any static web host or opened directly as `file://` in a browser.

## File Structure

```
naturalization-tracker/
├── index.html              # Entry point
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.jsx            # React entry
│   ├── App.jsx             # Main app component
│   ├── App.css             # App styles
│   ├── index.css           # Global styles
│   ├── components/
│   │   ├── EligibilityDashboard.jsx
│   │   ├── ProfileForm.jsx
│   │   ├── TripManager.jsx
│   │   ├── CivicsTest.jsx
│   │   ├── LocationMap.jsx
│   │   └── DataPackExport.jsx
│   └── utils/
│       ├── eligibilityUtils.js    # Core eligibility calculations
│       ├── storage.js              # IndexedDB persistence
│       └── civicsQuestions.js      # Question bank
```

## Usage Guide

### 1. Set Up Profile
- Navigate to "Profile & Residence"
- Enter your date of birth, LPR date, eligibility path, and state residence info
- Save the profile

### 2. Add Travel History
- Go to "Travel History"
- Add trips manually or import via CSV
- CSV format: `startDate,endDate,destination,countAsAbsence`
- Example: `2023-01-15,2023-02-10,Mexico,true`

### 3. Monitor Eligibility
- Dashboard automatically updates as you add/edit data
- Use scenario toggle to model future trips
- Pay attention to warnings for trips ≥180 days

### 4. Practice Civics
- Take practice quizzes to prepare for the interview
- Review accuracy trends by category
- Focus on weak areas for targeted improvement

### 5. Export Data Pack
- Generate printable PDF for your records
- Export JSON backup to move data between devices
- Use privacy toggle to control personal info inclusion

## Privacy & Security

- **No servers:** All data stays on your device
- **No tracking:** No analytics, no beacons, no remote requests
- **Local storage:** IndexedDB for structured persistence
- **Wipe functionality:** Clear all data with one click
- **Optional encryption:** Future enhancement via WebCrypto

## Performance

- Supports 1,000+ trips with <200ms recomputation
- Deterministic eligibility calculations
- Responsive UI with optimistic updates
- Print-friendly CSS with proper page breaks

## Accessibility

- Keyboard navigable
- High-contrast friendly charts
- Grayscale-readable exports
- Semantic HTML structure
- ARIA labels where applicable

## Legal Disclaimer

**This tool is for informational purposes only and does not constitute legal advice.**

The calculations provided are based on general USCIS guidelines and statutory requirements, but:
- Individual cases may have unique circumstances
- Immigration law is complex and subject to change
- USCIS officers have discretion in evaluating applications

**Always consult with a qualified immigration attorney** before making decisions about your naturalization application.

## References

This application implements requirements based on:
- INA § 316(a) - General naturalization requirements
- 8 CFR § 316.2 - Eligibility and naturalization authority
- Form N-400 Instructions (USCIS)
- USCIS Policy Manual, Volume 12

## Support & Contributions

This is a personal-use tool. No warranty is provided. Use at your own risk.

## License

MIT License - Feel free to modify and distribute with attribution.

---

**Built for LPRs planning their naturalization journey. Good luck! 🇺🇸**
