const fs = require('fs');
const path = require('path');

// Guarantees compatibility whether Vercel expects ".next" or "frontend/.next"
try {
  const dotNext = path.join(__dirname, '.next');
  const targetDir = path.join(__dirname, 'frontend');
  const targetDotNext = path.join(targetDir, '.next');

  if (fs.existsSync(dotNext)) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    if (!fs.existsSync(targetDotNext)) {
      try {
        fs.symlinkSync(dotNext, targetDotNext, 'junction');
        console.log('[postbuild] Created symlink for frontend/.next');
      } catch (err) {
        console.log('[postbuild] Copying .next to frontend/.next for Vercel compatibility...');
        fs.cpSync(dotNext, targetDotNext, { recursive: true });
        console.log('[postbuild] Successfully copied .next');
      }
    } else {
      console.log('[postbuild] frontend/.next already exists');
    }
  }
} catch (e) {
  console.warn('[postbuild] Warning:', e.message);
}
