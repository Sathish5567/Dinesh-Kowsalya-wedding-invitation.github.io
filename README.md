# Dinesh & Kowsalya Wedding Invitation

A responsive single-page wedding invitation built with React and Vite.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm ci` in this folder.
3. Run `npm run dev` and open the local URL printed in the terminal.
4. Run `npm run build` to create a production build in `dist/`.

Wedding details are in `src/invitation.js`. Images, video, and music are in `public/assets/`.

## GitHub Pages

Push changes to `main`. The workflow in `.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages.

## RSVP

RSVP replies are saved in the visitor’s browser on that device. They are not sent to the couple or shared between visitors.
