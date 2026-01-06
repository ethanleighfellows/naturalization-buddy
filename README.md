# Naturalization Buddy

Naturalization Buddy is a personal planning tool for tracking U.S. naturalization eligibility, residence and travel history, and civics test practice. It is designed for individual use only and does not provide legal advice or representation.

## Overview

- Calculates eligibility under the 5‑year and 3‑year (spouse) naturalization paths, including early‑filing windows, continuous residence, and physical presence requirements.
- Models absences with rolling 5‑year lookback, long‑trip continuity issues, and "lower‑risk" filing dates based on travel history.
- Includes a civics quiz module based on the 2025 128‑question USCIS test, with weighted question selection and multiple‑choice answers.

## Features

### Profile Management
- LPR date, date of birth, state and start of state residence, and eligibility path selection.
- Clear metrics for age, green card time, and state‑residence requirements.

### Travel History and Physical Presence
- Add/edit/delete trips, including multi‑country destinations and CSV bulk import.
- Travel analysis computes total trips, total days absent, long absences (≥180 days), and physical presence as a percentage of the statutory requirement.
- Rolling 5-year window calculations for continuous residence recovery dates.

### Civics Practice
- Ten‑question multiple‑choice quizzes with weighted randomization across the 128 official 2025 civics questions.
- Attempts and scores are stored locally in the browser only.

### Data Export
- Export profile, trips, and eligibility data as JSON or printable PDF.
- All data is stored locally in browser localStorage.

## Development

### Tech Stack
- React + Vite frontend
- date‑fns for date calculations
- localStorage for client-side data persistence

### Local Setup

Clone the repository and install dependencies:

bash
npm install


Run the development server:

bash
npm run dev


Build for production:

bash
npm run build


Preview production build:

bash
npm run preview

## Deployment

The project is configured to build as a static site suitable for hosting on GitHub Pages.

### GitHub Actions Deployment

A CI workflow is included that automatically builds and deploys to GitHub Pages when you push to the main branch:

1. Ensure `vite.config.js` has the correct `base` path for your repository
2. Enable GitHub Pages in your repository settings (Settings → Pages → Source: GitHub Actions)
3. Push to main branch - deployment happens automatically

Your site will be available at: `https://YOUR-USERNAME.github.io/REPO-NAME/`

## Legal Notice and License (Restricted Use)

This software, its source code, assets, and documentation (collectively, the "Software") are provided to you solely for your own personal, non‑commercial use. Except as expressly permitted below, all rights are reserved by the author and/or rights holder.

### Permitted Use

You are granted a limited, revocable, non‑transferable license to:

- Download, install, and run the Software for your personal, non‑commercial purposes only.
- Make minimal modifications to the Software as reasonably necessary to run it for your personal, non‑commercial use.

### Prohibited Actions

You are expressly prohibited from:

- **Redistributing, sublicensing, selling, leasing, lending, or otherwise making the Software or any derivative work available to any third party**, whether for commercial or non‑commercial purposes, including but not limited to publishing it on public package registries, template marketplaces, or code‑sharing platforms.
- **Hosting the Software, or any modified version of it, as a public‑facing service or application for others to use**, whether free or paid, including deploying it as a web application, SaaS offering, or similar service.
- **Creating derivative works for the purpose of distribution, public hosting, resale, or inclusion in another product or service**.
- **Removing, obscuring, or altering any copyright notices, authorship attributions, or this license and legal notice**.

Any use of the Software in violation of these terms, including any redistribution or public deployment, is strictly prohibited and may constitute copyright infringement and/or breach of license. No implied rights or licenses are granted, including any rights under trademark, patent, or trade secret law.

### Disclaimer of Warranties and Limitation of Liability

The Software is provided "AS IS," without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non‑infringement. To the maximum extent permitted by law, the author and all contributors shall not be liable for any damages arising out of or in connection with use of or inability to use the Software, including but not limited to direct, indirect, incidental, consequential, special, or exemplary damages, even if advised of the possibility of such damages.

### No Legal Advice

This project is an independent personal tool and is not affiliated with, endorsed by, or sponsored by USCIS, the U.S. government, or any other governmental agency. **It is not legal advice and does not substitute for consulting a qualified immigration attorney**. Always consult with a licensed immigration attorney for advice specific to your situation.

### Enforcement

The author reserves all rights to enforce this license and pursue all available legal remedies for any violation of these terms.

© 2026. All rights reserved.
