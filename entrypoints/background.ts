import { onMessage } from '@/utils/messaging';

export default defineBackground(() => {
  // --- Installation ---
  // Open the welcome page on first install so the user can grant host access
  // from a button click (chrome.permissions.request() requires a user gesture).
  // See docs/09-cws-best-practices.md and docs/10-onboarding.md.
  browser.runtime.onInstalled.addListener((details) => {
    console.log(`Extension installed: ${details.reason}`);
    if (details.reason !== 'install') return;
    // Promise chain instead of async/await so listener registration stays
    // trivially synchronous (SW lifecycle requirement).
    void browser.storage.local
      .get('welcomeShown')
      .then(({ welcomeShown }) => {
        if (welcomeShown) return;
        void browser.storage.local.set({ welcomeShown: true });
        browser.tabs.create({
          url: browser.runtime.getURL('/welcome.html'),
        });
      });
  });

  // --- Messaging (remove if unused) ---
  onMessage('ping', () => {
    return 'pong';
  });

  // --- Alarms (remove if unused) ---
  browser.alarms.create('periodic-check', { periodInMinutes: 30 });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'periodic-check') {
      console.log('Periodic alarm fired');
    }
  });
});
