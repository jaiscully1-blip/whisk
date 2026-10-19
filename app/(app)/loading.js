// Shown the instant a tab is tapped, so the switch never waits on the server. It is neutral (no tab colour), so nothing from the next page leaks onto this one.
export default function Loading() {
  return <div aria-busy="true" aria-label="Loading" style={{ minHeight: '60vh' }} />;
}
