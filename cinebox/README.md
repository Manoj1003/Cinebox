# Cinebox – media player, cloud library and converter

A static website (index.html + sw.js). Home with quick access to your uploads, USB/local player, image converter, video converter and "My library" (/library) which stores videos in your own Google Drive.

## What's new
- **Uploads**: original bytes (no re-encoding, no quality loss), large streaming requests, two files at once, live speed + time left, per-file Cancel and Cancel all, automatic reconnect-and-retry, screen kept awake.
- **Home**: "Continue watching" (resumes where you stopped) and "My uploads" cards, one tap to play.
- **Audio tracks, any size, any browser**: the player's Audio menu lists every track (language, codec, channels). Tracks are read straight out of MP4/MOV/M4V/MKV files without loading the whole file. Safari uses its native tracks. Only codecs the browser cannot decode (e.g. DTS) need the converter, limited to about 1 GB.
- **Drive playback**: read-ahead streaming service worker (several 8 MB parts in parallel, retries, honours token expiry), buffering spinner, buffered bar.
- **Blank picture**: if the video uses a format the browser cannot decode (HEVC / 10-bit) you get a clear message plus "Make a compatible copy" (visually lossless H.264, all audio kept).

## Run locally
    npx serve        # reads vercel.json (COOP/COEP headers for the converter)

## Deploy on Vercel
Push the folder (index.html, sw.js, vercel.json) and import it; Framework "Other", no build command.

## Google Drive setup
Enable the Drive API, OAuth consent screen External with only the `drive.file` scope (Publish app), OAuth client ID (Web application) with redirect URI `https://YOUR-SITE.vercel.app/`. Put the client ID in `GCID` in index.html.
