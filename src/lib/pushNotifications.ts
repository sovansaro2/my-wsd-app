import { api } from './apiClient';
import { buildUpcomingReminderPayloads } from '../../shared/calendarReminders';
import type { MonasteryEvent } from '../types/calendar';

const ALERTS_ENABLED_KEY = 'wsd_calendar_push_enabled';
const LOCAL_NOTIFIED_PREFIX = 'wsd_local_notified_';

export interface PushStatus {
  supported: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  needsHomeScreenInstall: boolean;
  permission: NotificationPermission | 'unsupported';
  enabled: boolean;
  serverPushActive: boolean;
  serverConfigured: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getDeviceLabel(): string {
  const ua = navigator.userAgent || '';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  return 'Web Device';
}

async function getReadyServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    const ready = await Promise.race<ServiceWorkerRegistration | null>([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    return ready;
  } catch {
    return null;
  }
}

export async function getPushStatus(): Promise<PushStatus> {
  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true);

  const hasNotificationApi = typeof window !== 'undefined' && 'Notification' in window;
  const supported = hasNotificationApi && typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const needsHomeScreenInstall = isIOS && !isStandalone;

  const permission: NotificationPermission | 'unsupported' = hasNotificationApi
    ? Notification.permission
    : 'unsupported';

  let serverConfigured = false;
  let serverPushActive = false;

  try {
    const cfg = await api.getPushConfig();
    serverConfigured = Boolean(cfg?.enabled && cfg?.vapidPublicKey);
  } catch {}

  if (supported && permission === 'granted') {
    const reg = await getReadyServiceWorker();
    if (reg && 'pushManager' in reg) {
      try {
        const sub = await reg.pushManager.getSubscription();
        serverPushActive = Boolean(sub);
      } catch {}
    }
  }

  let localFlag = false;
  try {
    localFlag = localStorage.getItem(ALERTS_ENABLED_KEY) === '1';
  } catch {}

  const enabled = permission === 'granted' && (serverPushActive || localFlag);

  return {
    supported,
    isIOS,
    isStandalone,
    needsHomeScreenInstall,
    permission,
    enabled,
    serverPushActive,
    serverConfigured,
  };
}

export async function enableCalendarNotifications(): Promise<{
  ok: boolean;
  serverPushActive: boolean;
  message: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      ok: false,
      serverPushActive: false,
      message: 'ឧបករណ៍នេះមិនគាំទ្រការជូនដំណឹងទេ (បើប្រើ iPhone សូមចុច Share → Add to Home Screen មុនសិន)',
    };
  }

  let perm = Notification.permission;
  if (perm !== 'granted') {
    perm = await Notification.requestPermission();
  }

  if (perm !== 'granted') {
    return {
      ok: false,
      serverPushActive: false,
      message: 'អ្នកបានបិទសិទ្ធិជូនដំណឹង — សូមបើកក្នុងការកំណត់ Browser ឬទូរស័ព្ទ',
    };
  }

  try {
    localStorage.setItem(ALERTS_ENABLED_KEY, '1');
  } catch {}

  // Try full Web Push subscription if server VAPID key is configured
  let serverPushActive = false;
  try {
    const cfg = await api.getPushConfig();
    if (cfg?.enabled && cfg?.vapidPublicKey) {
      const reg = await getReadyServiceWorker();
      if (reg && 'pushManager' in reg) {
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          const keyBytes = urlBase64ToUint8Array(cfg.vapidPublicKey);
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyBytes.buffer.slice(
              keyBytes.byteOffset,
              keyBytes.byteOffset + keyBytes.byteLength
            ) as ArrayBuffer,
          });
        }
        const json = sub.toJSON();
        if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
          await api.subscribePush({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
            device_label: getDeviceLabel(),
            notify_seil: true,
            notify_events: true,
          });
          serverPushActive = true;
        }
      }
    }
  } catch {
    // Keep local notification mode active if push server subscription fails
  }

  return {
    ok: true,
    serverPushActive,
    message: serverPushActive
      ? 'បានបើកការជូនដំណឹងលើ Lock Screen ២៤ ម៉ោងរួចរាល់'
      : 'បានបើកការជូនដំណឹងលើឧបករណ៍នេះរួចរាល់',
  };
}

export async function disableCalendarNotifications(): Promise<void> {
  try {
    localStorage.removeItem(ALERTS_ENABLED_KEY);
  } catch {}

  const reg = await getReadyServiceWorker();
  if (reg && 'pushManager' in reg) {
    try {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await api.unsubscribePush(endpoint).catch(() => {});
      }
    } catch {}
  }
}

async function showLocalOSNotification(title: string, body: string, tag: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/icon-192.png',
    tag,
    data: { url: '/?open=calendar' },
  };

  const reg = await getReadyServiceWorker();
  if (reg && 'showNotification' in reg) {
    await reg.showNotification(title, options);
    return true;
  }

  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sends an immediate test notification (via real server Web Push if active,
 * or via Service Worker OS Notification locally).
 */
export async function sendTestCalendarNotification(): Promise<{ ok: boolean; via: 'push' | 'local'; message: string }> {
  const reg = await getReadyServiceWorker();
  if (reg && 'pushManager' in reg) {
    try {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const json = sub.toJSON();
        if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
          await api.sendTestPush({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          });
          return {
            ok: true,
            via: 'push',
            message: 'បានផ្ញើសារសាកល្បងតាម Web Push រួចរាល់',
          };
        }
      }
    } catch {
      // Fallback to local OS notification
    }
  }

  const shown = await showLocalOSNotification(
    'វត្តស្នាយដួច · សាកល្បងការជូនដំណឹង',
    'ការរំលឹកថ្ងៃសីល និងថ្ងៃបុណ្យលើទូរស័ព្ទដំណើរការបានល្អ!',
    'wsd-local-test'
  );

  return {
    ok: shown,
    via: 'local',
    message: shown
      ? 'បានបង្ហាញសារសាកល្បងលើឧបករណ៍រួចរាល់'
      : 'សូមបើកសិទ្ធិជូនដំណឹងជាមុនសិន',
  };
}

/**
 * Checks today/tomorrow events & Seil days when the app opens and shows
 * OS notifications at most once per day per reminder tag.
 */
export async function checkAndNotifyUpcomingLocally(events: MonasteryEvent[]): Promise<void> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (localStorage.getItem(ALERTS_ENABLED_KEY) !== '1') return;

    const payloads = buildUpcomingReminderPayloads(events, {
      includeSeil: true,
      includeEvents: true,
    });

    if (payloads.length === 0) return;

    const todayStamp = new Date().toISOString().slice(0, 10);
    for (const item of payloads.slice(0, 3)) {
      const key = `${LOCAL_NOTIFIED_PREFIX}${todayStamp}_${item.tag || item.title}`;
      if (localStorage.getItem(key)) continue;

      const shown = await showLocalOSNotification(item.title, item.body, item.tag || 'wsd-calendar');
      if (shown) {
        localStorage.setItem(key, '1');
      }
    }
  } catch {}
}
