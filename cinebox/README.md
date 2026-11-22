# Cinebox – media player, cloud library and converter

A static website (index.html + sw.js). Home with quick access to your uploads, USB/local player, image converter, video converter and "My library" (/library) which stores videos in your own Google Drive.

## What's new
- **Uploads**: original bytes (no re-encoding, no quality loss), large streaming requests, two files at once, live speed + time left, per-file Cancel and Cancel all, automatic reconnect-and-retry, screen kept awake.
- **Home**: "Continue watching" (resumes where you stopped) and "My uploads" cards, one tap to play.
- **Audio tracks, any size, any browser**: the player's Audio menu lists every track (language, codec, channels). Tracks are read straight out of MP4/MOV/M4V/MKV files without loading the whole file. Safari uses its native tracks. Only codecs the browser cannot decode (e.g. DTS) need the converter, limited to about 1 GB.
- **Drive playback**: read-ahead streaming service worker (several 8 MB parts in parallel, retries, honours token expiry), buffering spinner, buffered bar.
- **Blank picture**: if the video uses a format the browser cannot decode (HEVC / 10-bit) you get a clear message plus "Make a compatible copy" (visually lossless H.264, all audio kept).
- **Fixes in this version**
  - MKV audio tracks that use *lacing* (several frames per block) now switch correctly. This was the "Laced audio is not supported" error.
  - Dolby Digital / Digital+ / DTS / TrueHD tracks in MP4/MKV are read straight from the file and only that small stream is converted, so it works for files of any size (no 1 GB limit).
  - The "Output" button only appears in browsers that can choose an audio output (it is hidden on phones and TVs).
  - Blank picture: Cinebox now probes the video. H.264 in an unsupported container is repaired in seconds (no re-encode). HEVC / 10-bit / other codecs are converted to H.264 with all audio tracks kept: "fast" (720p) or "full quality". Phones default to fast.
  - Fixed "Maximum call stack size exceeded" when switching audio in long MKV/MP4 files, and made track reading faster (read-ahead scanning, video data inside block groups is no longer copied).
  - Phone layout: compact scrolling menu, two-row player controls with big touch targets, audio and playlist as bottom sheets, safe-area (notch) support, landscape mode, double-tap left/right to skip 10 s (double-tap centre = fullscreen), fullscreen that also works on iPhone.

## Run locally
    npx serve        # reads vercel.json (COOP/COEP headers for the converter)

## Deploy on Vercel
Push the folder (index.html, sw.js, vercel.json) and import it; Framework "Other", no build command.

## Google Drive setup
Enable the Drive API, OAuth consent screen External with only the `drive.file` scope (Publish app), OAuth client ID (Web application) with redirect URI `https://YOUR-SITE.vercel.app/`. Put the client ID in `GCID` in index.html.
