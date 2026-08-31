import api from '@/lib/api';

export async function subscribeToPush(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  try {
    const { data: vapidData } = await api.get('/notifications/push/vapid-public-key');
    const pubKey = vapidData?.publicKey;
    if (!pubKey) return false;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: pubKey,
    });
    const { endpoint, keys } = sub.toJSON() as any;
    await api.post('/notifications/push/subscribe', { endpoint, p256dh: keys.p256dh, auth: keys.auth });
    return true;
  } catch {
    return false;
  }
}

export async function ensurePushSubscribed(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (Notification.permission !== 'default') return;
  await subscribeToPush();
}
