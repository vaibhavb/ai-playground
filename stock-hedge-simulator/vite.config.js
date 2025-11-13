import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const normalizeBase = (basePath) => {
  if (!basePath) {
    return './';
  }

  let normalized = basePath;
  if (!normalized.startsWith('/') && !normalized.startsWith('./')) {
    normalized = `/${normalized}`;
  }

  return normalized.endsWith('/') ? normalized : `${normalized}/`;
};

export default defineConfig({
  plugins: [react()],
  base: normalizeBase(process.env.PUBLIC_BASE_PATH),
});
