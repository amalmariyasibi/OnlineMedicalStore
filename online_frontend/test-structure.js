#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Current working directory:', process.cwd());
console.log('Directory contents:', fs.readdirSync('.'));

if (fs.existsSync('online_frontend')) {
  console.log('online_frontend directory exists');
  console.log('online_frontend contents:', fs.readdirSync('online_frontend'));
  
  if (fs.existsSync('online_frontend/package.json')) {
    console.log('package.json found in online_frontend');
    const pkg = JSON.parse(fs.readFileSync('online_frontend/package.json', 'utf8'));
    console.log('Package name:', pkg.name);
  } else {
    console.log('package.json NOT found in online_frontend');
  }
} else {
  console.log('online_frontend directory does NOT exist');
}

// Try to read package.json from current directory
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('Package.json in current directory:', pkg.name);
} catch (err) {
  console.log('No package.json in current directory');
}