'use client';
import { useEffect, useRef, useState } from 'react';

// Cookies & privacy, the way mobile games do it: one friendly card first (Accept all / Essential only / Manage),
// and a second panel with a switch per purpose. Essential storage is always on; everything else is opt-in.
// Whisk has no ads, analytics or trackers, so there are only three purposes to choose from.
export const CONSENT_KEY = 'whisk-consent';
export const deviceTimeZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { return null; } };

const PURPOSES = [
  { k: 'essential', title: 'Essential', body: 'Keeps you signed in and your account secure. The game can’t run without it.', locked: true },
  { k: 'preferences', title: 'Remember my place', body: 'Saves your tab, scroll spot and half-typed text on this device, so you pick up right where you left off.' },
  { k: 'local_time', title: 'My local time', body: 'Uses your time zone so days, streaks and daily rewards reset at midnight where you live, not on a server clock.' }
];

export default function CookieConsent({ initial, onSave, onClose }) {
  const [view, setView] = useState(initial ? 'manage' : 'intro');
  const [prefs, setPrefs] = useState({ preferences: initial?.preferences ?? true, local_time: initial?.local_time ?? true });
  const [busy, setBusy] = useState(false);
  const first = useRef(null);
  useEffect(() => { first.current?.focus(); }, [view]);
  const tz = deviceTimeZone();

  async function save(choice) { if (busy) return; setBusy(true); try { await onSave(choice); } finally { setBusy(false); } }

  return (
    <div className="cc-scrim" role="presentation">
      <div className={`cc-card ${view}`} role="dialog" aria-modal="true" aria-labelledby="cc-title" aria-describedby="cc-body">
        <div className="cc-hero" aria-hidden="true">
          <img className="cc-logo" src="/icon.svg" alt="" width="64" height="64" />
          <img className="cc-cookie" src="/cookie.svg" alt="" width="54" height="54" />
          <span className="cc-crumb a" /><span className="cc-crumb b" /><span className="cc-crumb c" />
        </div>

        {view === 'intro' ? (
          <div className="cc-pane" key="intro">
            <h2 id="cc-title">Cookies, chef?</h2>
            <p id="cc-body">Whisk uses cookies and a little storage on your device to keep you signed in, remember where you left off, and run your daily rewards on your local calendar. <b>No ads. We never sell your data.</b></p>
            <button ref={first} className="btn wide cc-accept" disabled={busy} onClick={() => save({ preferences: true, local_time: true })}>Accept all</button>
            <div className="cc-row">
              <button className="btn ghost" disabled={busy} onClick={() => save({ preferences: false, local_time: false })}>Essential only</button>
              <button className="btn ghost" disabled={busy} onClick={() => setView('manage')}>Manage choices</button>
            </div>
            <p className="cc-fine">You can change this any time in Me → Settings → Cookies &amp; privacy.</p>
          </div>
        ) : (
          <div className="cc-pane" key="manage">
            <h2 id="cc-title">Your choices</h2>
            <p id="cc-body" className="cc-sub">Pick what Whisk may store. Essential is always on.</p>
            <ul className="cc-list">
              {PURPOSES.map((p, i) => {
                const on = p.locked ? true : prefs[p.k];
                return (
                  <li key={p.k}>
                    <div className="cc-text"><b id={`cc-${p.k}`}>{p.title}</b><span>{p.body}{p.k === 'local_time' && tz ? <em> Your time zone: {tz.replace(/_/g, ' ')}.</em> : null}</span></div>
                    <button ref={i === 1 ? first : undefined} role="switch" aria-checked={on} aria-labelledby={`cc-${p.k}`} disabled={p.locked}
                      className={`cc-switch ${on ? 'on' : ''} ${p.locked ? 'locked' : ''}`} onClick={() => !p.locked && setPrefs((x) => ({ ...x, [p.k]: !x[p.k] }))}>
                      <span />
                    </button>
                  </li>
                );
              })}
            </ul>
            <button className="btn wide cc-accept" disabled={busy} onClick={() => save(prefs)}>Save my choices</button>
            <div className="cc-row">
              <button className="btn ghost" disabled={busy} onClick={() => save({ preferences: true, local_time: true })}>Accept all</button>
              {initial ? <button className="btn ghost" onClick={onClose}>Cancel</button> : <button className="btn ghost" onClick={() => setView('intro')}>Back</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
