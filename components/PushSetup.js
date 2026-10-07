'use client';
import { useState } from 'react';

// Admin → Notifications setup. Makes the keys IN THIS BROWSER (nothing is sent anywhere) and shows exactly what to
// paste where: three values into Vercel, one SQL snippet into Supabase. Never paste these into a chat.
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export default function PushSetup() {
  const [k, setK] = useState(null);
  async function make() {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const pub = b64u(await crypto.subtle.exportKey('raw', pair.publicKey));
    const priv = (await crypto.subtle.exportKey('jwk', pair.privateKey)).d;
    const secret = b64u(crypto.getRandomValues(new Uint8Array(32)));
    const fp = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)));
    const url = `${window.location.origin}/api/push/due`;
    const sql = `-- Whisk notifications (run once in Supabase → SQL Editor, after setup/14-notifications.sql)
insert into private.app_secrets (name, sha256_hex) values ('push_sender', '${fp}')
on conflict (name) do update set sha256_hex = excluded.sha256_hex;
select cron.unschedule('whisk-push') where exists (select 1 from cron.job where jobname = 'whisk-push');
select cron.schedule('whisk-push', '0 * * * *', $job$
  select net.http_post(url := '${url}', headers := jsonb_build_object('Authorization', 'Bearer ${secret}', 'Content-Type', 'application/json'), body := '{}'::jsonb);
$job$);`;
    setK({ pub, priv, secret, sql });
  }
  const copy = (t) => navigator.clipboard?.writeText(t).catch(() => {});
  const Field = ({ label, value }) => (
    <div className="stack" style={{ gap: 4 }}>
      <span className="lbl">{label}</span>
      <div className="row" style={{ flexWrap: 'nowrap' }}><input className="input mono" readOnly value={value} onFocus={(e) => e.target.select()} aria-label={label} /><button type="button" className="btn ghost sm" onClick={() => copy(value)}>Copy</button></div>
    </div>
  );
  return (
    <section className="adm-card stack" style={{ gap: 10 }}>
      <h3>Notifications setup</h3>
      <p className="desc" style={{ margin: 0 }}>Makes the keys in this browser. Nothing is sent anywhere. Don’t paste them into a chat.</p>
      {!k ? <button className="btn" onClick={make}>Make notification keys</button> : (
        <>
          <b>1. Vercel → Settings → Environment Variables (Production + Preview, Sensitive except the first)</b>
          <Field label="NEXT_PUBLIC_VAPID_PUBLIC_KEY" value={k.pub} />
          <Field label="VAPID_PRIVATE_KEY" value={k.priv} />
          <Field label="PUSH_SECRET" value={k.secret} />
          <b>2. Supabase → SQL Editor: run this (it stores only a fingerprint of the secret, and calls Whisk every hour)</b>
          <textarea className="input mono" readOnly rows={8} value={k.sql} onFocus={(e) => e.target.select()} aria-label="SQL" />
          <button type="button" className="btn ghost sm" onClick={() => copy(k.sql)}>Copy SQL</button>
          <b>3. Redeploy on Vercel.</b>
        </>
      )}
    </section>
  );
}
