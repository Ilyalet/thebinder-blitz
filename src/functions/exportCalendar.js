import { base44 } from '@/api/base44Client';

// The old app-embedded client returned an axios-style { data, headers } object
// from function calls. The standalone SDK's functions.fetch() returns a native
// Response instead (needed here since this is a binary/text file download, not
// JSON) — this adapter reshapes it so Calendar.jsx doesn't need to change.
export async function exportCalendar() {
  const response = await base44.functions.fetch('/exportCalendar');
  if (!response.ok) {
    throw new Error(`exportCalendar failed: ${response.status}`);
  }
  const data = await response.text();
  const headers = {
    'content-type': response.headers.get('content-type') || 'text/calendar',
    'content-disposition': response.headers.get('content-disposition') || '',
  };
  return { data, headers };
}
