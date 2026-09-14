// POST { subscription } — restore the watch this phone had BEFORE its most recent auto-park.
// Fork addition: a CarPlay/Bluetooth disconnect in someone else's car fires the Shortcut too and
// overwrites the real spot; /api/parked keeps the replaced spot as prevSpot so this can put it back
// in one tap. Auth = possession of the push endpoint (same capability model as my-spot). One level.
import { getSub, saveSub, storeReady } from './_store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  if (!storeReady()) { res.status(503).json({ error: 'store not configured' }); return; }
  try {
    const ep = req.body && req.body.subscription && req.body.subscription.endpoint;
    if (typeof ep !== 'string' || !ep.startsWith('https://') || ep.length > 1024) {
      res.status(400).json({ error: 'bad subscription' }); return;
    }
    const rec = await getSub(ep);
    if (!rec || !rec.subscription) { res.status(410).json({ error: 'subscription gone' }); return; }
    if (!rec.prevSpot || !rec.prevSpot.cnn) { res.status(200).json({ ok: false, note: 'nothing to undo' }); return; }
    const restored = rec.prevSpot;
    await saveSub(rec.subscription, restored); // no `extra` → prevSpot cleared: exactly one level of undo
    res.status(200).json({ ok: true, spot: restored });
  } catch (e) {
    console.error('parked-undo failed:', e);
    res.status(500).json({ error: 'internal error' });
  }
}
