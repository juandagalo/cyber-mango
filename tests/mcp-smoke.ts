import { spawn } from 'child_process';
import { mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');

mkdirSync(join(projectRoot, 'data'), { recursive: true });

const proc = spawn('npx', ['tsx', 'mcp-server.ts'], {
    cwd: projectRoot,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
        ...process.env,
        CYBER_MANGO_DB_PATH: join(projectRoot, 'data', 'test-smoke.db'),
    },
    shell: process.platform === 'win32',
});

let hasError = false;

proc.stderr?.on('data', (data: Buffer) => {
    console.log(`[stderr] ${data.toString().trim()}`);
});

proc.stdout?.on('data', (data: Buffer) => {
    const text = data.toString();
    // stdout should only ever carry JSON-RPC framing from the MCP transport
    if (text.trim() && !text.trim().startsWith('{') && !text.trim().startsWith('[')) {
        console.error(`WARNING: Non-JSON output on stdout: ${text}`);
        hasError = true;
    }
});

proc.on('error', (e) => {
    console.error('Failed to spawn process:', e.message);
    hasError = true;
});

// Wait 3 seconds — if the process is still running the server started cleanly
setTimeout(() => {
    if (proc.exitCode !== null) {
        console.error(`MCP server exited early with code ${proc.exitCode}`);
        process.exit(1);
    }

    if (hasError) {
        console.error('MCP server started but produced unexpected stdout output');
        proc.kill();
        process.exit(1);
    }

    console.log('MCP server started successfully (still running after 3s)');
    proc.kill();
    process.exit(0);
}, 3000);
