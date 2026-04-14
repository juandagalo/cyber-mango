import { defineConfig } from '@playwright/test';
import { join } from 'path';
import { tmpdir } from 'os';

const testDbPath = join(tmpdir(), `cyber-mango-e2e-${process.pid}.db`);

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		env: {
			CYBER_MANGO_DB_PATH: testDbPath
		}
	},
	projects: [
		{
			name: 'chromium',
			use: { browserName: 'chromium' }
		}
	]
});
