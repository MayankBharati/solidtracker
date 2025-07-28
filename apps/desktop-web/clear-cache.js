const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing all cache and build files...');

const dirsToClean = [
  '.next',
  'out',
  'node_modules/.cache',
  '.turbo'
];

const filesToClean = [
  'next-env.d.ts'
];

// Clean directories
dirsToClean.forEach(dir => {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Cleaned directory: ${dir}`);
    } else {
      console.log(`⏭️  Directory doesn't exist: ${dir}`);
    }
  } catch (error) {
    console.log(`❌ Failed to clean ${dir}:`, error.message);
  }
});

// Clean files
filesToClean.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Cleaned file: ${file}`);
    } else {
      console.log(`⏭️  File doesn't exist: ${file}`);
    }
  } catch (error) {
    console.log(`❌ Failed to clean ${file}:`, error.message);
  }
});

console.log('🎉 Cache cleaning completed!'); 