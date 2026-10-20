import { useWhisk } from './AppShell';
import { deviceTimeZone } from './CookieConsent';

// The player's time zone: the one they picked in Settings, else the one saved on their profile, else this device's.
export function useTimeZone() {
  const { ui, profile } = useWhisk();
  return ui?.tzPick || profile?.time_zone || deviceTimeZone() || undefined;
}
