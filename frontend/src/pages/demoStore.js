export const DEMO_NOTIFICATION_STORAGE_KEY = 'NIRIKSHAN_DEMO_NOTIFICATIONS';

export function readDemoNotifications() {
  try {
    const raw = localStorage.getItem(DEMO_NOTIFICATION_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveDemoNotification(event) {
  try {
    const existing = readDemoNotifications();
    const next = [event, ...existing].slice(0, 200);
    localStorage.setItem(DEMO_NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('nrikshan-demo-notification'));
    return next;
  } catch (error) {
    console.error('Could not save demo notification', error);
    return readDemoNotifications();
  }
}

export function updateDemoNotifications(updater) {
  const next = updater(readDemoNotifications());
  try {
    localStorage.setItem(DEMO_NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('nrikshan-demo-notification'));
  } catch (error) {
    console.error('Could not update demo notifications', error);
  }
  return next;
}
