# Cinebox – USB & local media player

A static website (one file: index.html). Plays video/audio from a USB drive or local files. Nothing is uploaded.

## Run locally
    cd cinebox
    python3 -m http.server 8000      # or: npx serve
Open http://localhost:8000 in Chrome or Edge.

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
