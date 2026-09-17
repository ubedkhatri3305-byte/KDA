const { execSync } = require('child_process');
const path = require('path');

console.log('=== K D A Start Dispatcher ===');
const isRender = !!process.env.RENDER;
const isVercel = !!process.env.VERCEL;

console.log(`Detected platform: ${isRender ? 'Render (Backend)' : isVercel ? 'Vercel (Frontend)' : 'Local/Generic'}`);

function run(cmd, cwd) {
  console.log(`Executing: ${cmd} in ${cwd || process.cwd()}`);
  execSync(cmd, {
    cwd: cwd || process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });
}

try {
  if (isRender) {
    const backendDir = path.join(__dirname, 'backend');
    console.log('Starting NestJS Backend for Render...');
    run('node dist/src/main.js', backendDir);
  } else if (isVercel) {
    const frontendDir = path.join(__dirname, 'frontend');
    console.log('Starting Next.js Frontend for Vercel...');
    run('npm run start', frontendDir);
  } else {
    const backendDir = path.join(__dirname, 'backend');
    run('node dist/src/main.js', backendDir);
  }
} catch (error) {
  console.error('Start execution failed:', error.message);
  process.exit(1);
}
