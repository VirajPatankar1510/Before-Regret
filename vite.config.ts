import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Vercel's "Automatically expose System Environment Variables" setting mirrors its git
  // metadata (VERCEL_GIT_COMMIT_MESSAGE, _SHA, _AUTHOR_NAME, etc.) into VITE_-prefixed
  // duplicates so framework tooling can read them -- which this blanket VITE_ passthrough was
  // then shipping straight into the public client bundle. That meant every commit message
  // (including ones describing security fixes) was readable by anyone via browser devtools.
  // Nothing in src/ reads VITE_VERCEL_* today (see src/context/AuthContext.tsx's getEnv), so
  // excluding the whole namespace is safe.
  const envDefine = Object.keys(process.env).reduce((acc, key) => {
    if (key.startsWith('VITE_') && !key.startsWith('VITE_VERCEL_')) {
      acc[`import.meta.env.${key}`] = JSON.stringify(process.env[key]);
    }
    return acc;
  }, {} as Record<string, string>);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: envDefine,
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
