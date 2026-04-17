import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  manifest: {
    name: 'My Extension',
    description: 'A brief description of what this extension does.',
    permissions: ['storage', 'alarms', 'sidePanel'],
    // Host access is requested at runtime from the welcome flow instead of
    // being declared up front. This keeps the install prompt empty and
    // avoids the "in-depth review" banner. Replace with the origins your
    // extension actually needs, or delete if you don't need host access.
    // See docs/03-cws-best-practices.md.
    optional_host_permissions: ['https://example.com/*'],
    minimum_chrome_version: '114',
  },
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
