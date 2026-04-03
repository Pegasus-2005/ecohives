import { execSync } from 'child_process';
const env = { ...process.env };
delete env.GEMINI_API_KEY;
try {
  execSync('npx vite build', { env, stdio: 'inherit' });
} catch (e) {
  console.error("Failed!");
}
