// POST { subscription } — which block is this phone's push subscription watching (if any)?
// Fork addition (auto-park): /api/parked arms the watch server-side, so the page has no local
// record of it — this endpoint lets the UI surface "where's my car". The push endpoint URL is
// an unguessable capability held only by the phone and this server (storage is keyed by it,
// exactly like save-subscription), so possession of the endpoint IS the auth. We return ONLY
// the spot fields — never the stored subscription record or its keys.
import { getSub, storeReady } from './_store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  if (!storeReady()) { res.status(503).json({ error: 'store not configured' }); return; }
  try {
    const ep = req.body && req.body.subscription && req.body.subscription.endpoint;
    if (typeof ep !== 'string' || !ep.startsWith('https://') || ep.length > 1024) {
      res.status(400).json({ error: 'bad subscription' }); return;
    }
    const rec = await getSub(ep);
    if (!rec || !rec.spot) { res.status(200).json({ ok: true, spot: null }); return; }
    res.status(200).json({ ok: true, spot: rec.spot, savedAt: rec.savedAt || null });
  } catch (e) {
    console.error('my-spot failed:', e);
    res.status(500).json({ error: 'internal error' });
  }
}
