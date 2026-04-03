import { execSync } from 'child_process';
try {
  execSync('rm -rf node_modules && npm install --omit=dev && npx vite build', { stdio: 'inherit' });
} catch (e) {
  console.error("Failed!");
}
