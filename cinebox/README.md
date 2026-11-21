# Cinebox – media player and converter

A static website (one file: index.html). Home page, USB/local player (with recently played), image converter/resizer and video converter. The USB player and converters run in the browser. "My library" (/library) stores videos in your own Google Drive.

## Run locally
    cd cinebox
    npx serve                        # reads vercel.json, so the video converter works
Open the printed http://localhost address in Chrome or Edge.

## Deploy on Vercel
Option A - CLI:
    npm i -g vercel
    cd cinebox
    vercel login
    vercel            # preview
    vercel --prod     # live (https URL)
Option B - GitHub: push this folder to a repo, then vercel.com > Add New > Project > Import. Framework: "Other". No build command, output directory empty (root).

## Use on TV
Open your https://....vercel.app address in the TV browser, plug in the USB, press "Open USB / folder".

Note: the video converter needs the COOP/COEP headers in vercel.json (already included) and an internet connection the first time, to load ffmpeg.wasm. A plain `python3 -m http.server` does not send them, so use `npx serve` or `vercel dev` locally.

## My library (Google Drive) setup
1. console.cloud.google.com > project > enable **Google Drive API**.
2. OAuth consent screen / Audience: External, scope only `drive.file`, then **Publish app** (no review needed).
3. Credentials > OAuth client ID (Web application). Authorized redirect URIs: `https://YOUR-SITE.vercel.app/api/callback` (and `http://localhost:3000/api/callback` for `vercel dev`).
4. Vercel > Settings > Environment Variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET` (any long random text). Redeploy.
Sign-in lasts a year per device. Deleting in the app deletes the file from Drive. Files older than 30 days are deleted when My library is opened.
