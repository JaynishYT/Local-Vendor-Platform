/** Convert 24h time "HH:MM" to "h:MM AM/PM" */
export function formatTime24ToAMPM(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12}:${String(m || 0).padStart(2, '0')} ${ampm}`;
}
