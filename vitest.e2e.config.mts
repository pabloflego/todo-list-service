import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [tsconfigPaths(), swc.vite()],
  test: {
    environment: 'node',
    globals: true,
    include: ['e2e/**/*.e2e.spec.ts'],
    exclude: ['dist/**'],
    coverage: { provider: 'v8', reportsDirectory: './coverage/e2e' },
  },
});
