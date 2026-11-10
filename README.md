# Cinebox – media player and converter

A static website (one file: index.html). Home page, USB/local player (with recently played), image converter/resizer and video converter. Nothing is uploaded.

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
