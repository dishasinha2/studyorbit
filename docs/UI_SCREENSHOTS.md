# UI Screenshots

Screenshots are required for final product verification, but could not be captured in this environment.

## Blocker

- Playwright is not installed.
- Browser automation is not available.
- The app now requires a reachable PostgreSQL database for authenticated runtime API data.

## New UI To Capture

- Profile page with career readiness visualization.
- Career profile completion form.
- Skills, interests, and career goals inputs.
- Document manager panel with upload, folders, filters, and document cards.

## Suggested Commands

After adding Playwright and starting the app with PostgreSQL:

```bash
npm run dev
npx playwright screenshot http://localhost:3000/profile docs/screenshots/profile-desktop.png
npx playwright screenshot --viewport-size=390,844 http://localhost:3000/profile docs/screenshots/profile-mobile.png
```

