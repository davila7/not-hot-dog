# not-hot-dog

Not Hotdog 🌭 — mobile-first web app (Next.js 16.4, App Router) that classifies a photo as *hotdog / not hotdog* using [Jev 1.14](https://typesafe.ai/blog/jev-1-14) from TypeSafe AI.

## How it works

1. The browser captures or picks a photo (`<input capture="environment">`).
2. `src/lib/prepare-image.ts` rotates it upright (EXIF), resizes it to ≤1024 px, and re-encodes it as JPEG to fit Jev's image limits.
3. `POST /api/classify` (`src/app/api/classify/route.ts`) forwards the photo to `POST https://api.typesafe.ai/v1/systemone` as multipart, with a single **Noul** question. `noul >= 0.5` → Hotdog.

Image input in Jev is a "Danger Zone" feature (`TypeSafe-Danger-Zone-Images: true`): TypeSafe does not consider it production-ready, and its format and limits may change between releases.

## Setup

```bash
cp .env.example .env.local   # set TYPESAFE_API_KEY
npm install
npm run dev
```

To try it on a phone over your LAN, run `npm run dev -- -H 0.0.0.0`. Note that `capture` on iOS/Android only opens the camera directly when served over HTTPS or localhost.

| Variable | Default | |
| - | - | - |
| `TYPESAFE_API_KEY` | — | Required. https://console.typesafe.ai/keys |
| `TYPESAFE_MODEL` | `jev-1.14.0` | Pinned, because `jev-latest` changes between releases. |
