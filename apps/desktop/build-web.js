const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Building desktop-web app...');

// Change to desktop-web directory and build
process.chdir('../desktop-web');
execSync('npm run build', { stdio: 'inherit' });

// Copy built files to desktop app
const sourceDir = path.join(process.cwd(), 'out');
const targetDir = path.join(__dirname, 'web-dist');

// Remove existing web-dist
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}

// Copy the built files
if (fs.existsSync(sourceDir)) {
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log('✅ Desktop-web app built and copied successfully!');
} else {
  console.error('❌ Build output not found. Make sure desktop-web builds to "out" directory.');
}

console.log('🎯 Build process completed!');
