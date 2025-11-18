import express from 'express';
import { Sandbox } from '@e2b/code-interpreter';

const router = express.Router();

// Language routing config -> decides file extension and run command
const LANGUAGE_RUNNERS: Record<string, { ext: string; run: (filepath: string) => string } > = {
  python: { ext: 'py', run: (p) => `python3 ${p}` },
  javascript: { ext: 'js', run: (p) => `node ${p}` },
  typescript: { ext: 'ts', run: (p) => `npx tsx ${p}` },
  bash: { ext: 'sh', run: (p) => `bash ${p}` },
  shell: { ext: 'sh', run: (p) => `bash ${p}` },
  c: { ext: 'c', run: (p) => `bash -lc "gcc ${p} -o /app_out && /app_out"` },
  cpp: { ext: 'cpp', run: (p) => `bash -lc "g++ ${p} -o /app_out && /app_out"` },
  go: { ext: 'go', run: (p) => `go run ${p}` },
  rust: { ext: 'rs', run: (p) => `bash -lc "rustc ${p} -o /app_out && /app_out"` },
  java: { ext: 'java', run: (_p) => `bash -lc "javac /Main.java && java -cp / Main"` },
  php: { ext: 'php', run: (p) => `php ${p}` },
  ruby: { ext: 'rb', run: (p) => `ruby ${p}` },
};

// Helpers
const detectHtml = (code?: string) => !!code && /<html[\s>]/i.test(code);

// Execute code in E2B sandbox
router.post('/run', async (req, res) => {
  const { code, language = 'javascript', input = '', files = [], path } = req.body || {};

  if (!code) return res.status(400).json({ error: 'Code is required' });

  const langKey = String(language || '').toLowerCase();
  const runner = LANGUAGE_RUNNERS[langKey];
  if (!runner) {
    return res.status(400).json({
      error: `Unsupported language: ${language}`,
      supported: Object.keys(LANGUAGE_RUNNERS)
    });
  }

  let sandbox: any;
  try {
    // Start sandbox (lives ~5 minutes by default)
    sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY, timeoutMs: 60_000 });

    // Ensure working dir
    const workDir = '/project';

    // Upload project files if provided
    if (Array.isArray(files) && files.length) {
      for (const f of files) {
        const target = f.path?.startsWith('/') ? f.path : `${workDir}/${f.path || ''}`;
        await sandbox.files.write(target, f.content ?? '');
      }
    }

    // Write main code file
    const filePath = path
      ? (path.startsWith('/') ? path : `${workDir}/${path}`)
      : `${workDir}/main.${runner.ext}`;

    // If JS and code is HTML, save as index.html for preview
    const isHtml = langKey === 'javascript' && detectHtml(code);
    const finalFilePath = isHtml ? `${workDir}/index.html` : filePath;

    await sandbox.files.write(finalFilePath, code);

    // Install Node deps when package.json exists
    if ((langKey === 'javascript' || langKey === 'typescript')) {
      const pkgJsonExists = Array.isArray(files) && files.some((f) => (f.path === 'package.json' || f.path === '/package.json' || f.path?.endsWith('/package.json')));
      if (pkgJsonExists) {
        await sandbox.commands.run(`bash -lc "cd ${workDir} && npm install"`);
      }
    }

    // Install Python deps when requirements.txt exists
    if (langKey === 'python') {
      const reqExists = Array.isArray(files) && files.some((f) => (f.path === 'requirements.txt' || f.path === '/requirements.txt' || f.path?.endsWith('/requirements.txt')));
      if (reqExists) {
        await sandbox.commands.run(`bash -lc "cd ${workDir} && pip install -r requirements.txt"`);
      }
    }

    // Decide command
    let cmd: string;
    if (isHtml) {
      // Start simple static server in background and return preview URL
      // Serve on 8000 to avoid conflicts
      await sandbox.commands.run(`bash -lc "cd ${workDir} && nohup python3 -m http.server 8000 >/dev/null 2>&1 &"`);
      // Try to expose preview URL
      let previewUrl: string | null = null;
      if (typeof sandbox.getHostname === 'function') {
        const host = await sandbox.getHostname();
        if (host) previewUrl = `https://${host}:8000/`;
      }

      // No direct command execution needed for pure HTML; return success
      return res.json({
        success: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        previewUrl,
      });
    } else {
      cmd = runner.run(finalFilePath);
    }

    // If input provided, pipe it
    const fullCmd = input ? `bash -lc "printf %s \"${input.replace(/"/g, '\\"')}\" | ${cmd}"` : cmd;

    const result = await sandbox.commands.run(fullCmd);

    // Best-effort preview for Node/TS web servers (user may have started a server on 3000/5173 etc.)
    let previewUrl: string | null = null;
    if (typeof sandbox.getHostname === 'function') {
      const host = await sandbox.getHostname();
      if (host) previewUrl = `https://${host}`; // User code should bind to 0.0.0.0 and expose port
    }

    return res.json({
      success: result.exitCode === 0,
      exitCode: result.exitCode ?? 0,
      stdout: result.stdout || result.logs || '',
      stderr: result.stderr || '',
      previewUrl,
    });
  } catch (error: any) {
    console.error('Execution error:', error);
    return res.status(500).json({ error: error?.message || 'Execution failed', details: String(error) });
  } finally {
    if (sandbox) {
      try { await (sandbox.kill?.() ?? sandbox.close?.()); } catch {}
    }
  }
});

// Execute terminal command (universal)
router.post('/command', async (req, res) => {
  const { command, cwd = '/project', timeout = 60_000 } = req.body || {};
  if (!command) return res.status(400).json({ error: 'Command is required' });

  let sandbox: any;
  try {
    sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY, timeoutMs: timeout });

    // Ensure work dir exists
    await sandbox.commands.run(`bash -lc "mkdir -p ${cwd}"`);

    const result = await sandbox.commands.run(`bash -lc "cd ${cwd} && ${command}"`, { timeoutMs: timeout });

    return res.json({
      success: result.exitCode === 0,
      exitCode: result.exitCode ?? 0,
      stdout: result.stdout || result.logs || '',
      stderr: result.stderr || '',
      cwd,
    });
  } catch (error: any) {
    console.error('Command execution error:', error);
    return res.status(500).json({ error: error?.message || 'Command failed', details: String(error) });
  } finally {
    if (sandbox) {
      try { await (sandbox.kill?.() ?? sandbox.close?.()); } catch {}
    }
  }
});

// Install packages (npm, pip, apt, cargo)
router.post('/install', async (req, res) => {
  const { packageManager = 'npm', packages = [] } = req.body || {};
  if (!Array.isArray(packages) || packages.length === 0) {
    return res.status(400).json({ error: 'Packages array is required' });
  }

  const commands: Record<string, string> = {
    npm: `npm install ${packages.join(' ')}`,
    pip: `pip install ${packages.join(' ')}`,
    apt: `apt-get update && apt-get install -y ${packages.join(' ')}`,
    cargo: `cargo install ${packages.join(' ')}`,
  };

  const cmd = commands[packageManager];
  if (!cmd) {
    return res.status(400).json({ error: `Unsupported package manager: ${packageManager}`, supported: Object.keys(commands) });
  }

  let sandbox: any;
  try {
    sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY, timeoutMs: 120_000 });

    const result = await sandbox.commands.run(`bash -lc "${cmd}"`, { timeoutMs: 120_000 });

    return res.json({
      success: result.exitCode === 0,
      exitCode: result.exitCode ?? 0,
      stdout: result.stdout || result.logs || '',
      stderr: result.stderr || '',
      packages,
    });
  } catch (error: any) {
    console.error('Installation error:', error);
    return res.status(500).json({ error: error?.message || 'Installation failed', details: String(error) });
  } finally {
    if (sandbox) {
      try { await (sandbox.kill?.() ?? sandbox.close?.()); } catch {}
    }
  }
});

export default router;
