# when-yahh

Countdown + live map for two people closing the distance. Built with Next.js
(App Router) and Leaflet.

## What it does

- **Countdown** to a target date/time (`app/page.js` → `TARGET_DATE`), styled
  like a mechanical odometer.
- **"Share my location" buttons** — tap one, it grabs your browser's GPS
  location and posts it to `/api/location`.
- **Live map** — polls every 8 seconds and plots both pins with a dashed
  line between them, plus the straight-line distance in km.

## Run it locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` on your own phone/laptop. In dev, location data
is written to a JSON file in `/tmp`, so no setup is needed to try it out. To
actually test with two people, you'll want to deploy it (see below) so you
each have a public URL — `getCurrentPosition` also requires HTTPS on real
phones (localhost is exempted, a deployed http:// domain is not).

## Deploy it (so both of you can use it)

1. Push this folder to a GitHub repo.
2. Import it into [Vercel](https://vercel.com) (free tier is plenty).
3. **Set up persistent storage** — Vercel's serverless functions don't share
   a filesystem, so the `/tmp` fallback won't work in production. Create a
   free [Upstash Redis](https://upstash.com) database, then add these two
   env vars in your Vercel project settings (copied from the Upstash
   dashboard):
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Deploy. Send the URL to your wife, you both open it, both tap "share."

## Personalizing it

- `app/page.js` → `TARGET_DATE`: change to your actual meetup time.
- `app/page.js` / `app/MapView.js`: the labels are just "me" / "wife" — feel
  free to swap in actual names.
- `app/globals.css` → `:root`: colors, if you want a different palette than
  the dusk-indigo/amber one here.

## Notes

- Location is only sent when someone taps the button — nothing runs in the
  background, no tracking.
- The map tiles are CARTO's free dark basemap, no API key required.
