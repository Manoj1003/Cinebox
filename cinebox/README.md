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
1. console.cloud.google.com > create a project (no billing needed).
2. APIs & Services > Library > enable **Google Drive API**.
3. APIs & Services > OAuth consent screen > External > fill app name and your email > add your Google account under **Test users**.
4. Credentials > Create credentials > **OAuth client ID** > Web application > Authorized JavaScript origins: `https://YOUR-SITE.vercel.app` and `http://localhost:3000`.
5. Paste the Client ID into `CLIENT_ID` at the top of the script in library.html, then redeploy.
Files appear in your Drive and count toward its 15 GB. Files older than 30 days are deleted when you open My library.
