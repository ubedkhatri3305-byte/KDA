const { execSync } = require('child_process');
const path = require('path');

console.log('=== K D A Build Dispatcher ===');
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
  const fs = require('fs');
  if (isRender) {
    // Render: Build NestJS backend
    const backendDir = path.join(__dirname, 'backend');
    console.log('Building Backend for Render...');
    if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
      run('npm install', backendDir);
    }
    run('npm run build', backendDir);
    console.log('Backend build complete for Render!');
  } else if (isVercel) {
    // Vercel: Build Next.js frontend
    const frontendDir = path.join(__dirname, 'frontend');
    console.log('Building Frontend for Vercel...');
    if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
      run('npm install', frontendDir);
    }
    run('npm run build', frontendDir);
    console.log('Frontend build complete for Vercel!');
  } else {
    // Fallback: build backend, then frontend
    const backendDir = path.join(__dirname, 'backend');
    const frontendDir = path.join(__dirname, 'frontend');
    try {
      if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
        run('npm install', backendDir);
      }
      run('npm run build', backendDir);
    } catch (err) {
      console.warn('Backend build skipped/warned:', err.message);
    }
    if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
      run('npm install', frontendDir);
    }
    run('npm run build', frontendDir);
  }
} catch (error) {
  console.error('Build execution failed:', error.message);
  process.exit(1);
}
