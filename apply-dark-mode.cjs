const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../4section-43bpm/components');

function addDarkClasses(text) {
  // Replace standard white backgrounds
  text = text.replace(/bg-white/g, 'bg-white dark:bg-slate-900');
  
  // Replace slate-50 and slate-100 backgrounds
  text = text.replace(/bg-slate-50\b(?! dark:)/g, 'bg-slate-50 dark:bg-slate-950');
  text = text.replace(/bg-slate-100\b(?! dark:)/g, 'bg-slate-100 dark:bg-slate-800');
  
  // Replace text colors
  text = text.replace(/text-slate-900\b(?! dark:)/g, 'text-slate-900 dark:text-slate-100');
  text = text.replace(/text-slate-800\b(?! dark:)/g, 'text-slate-800 dark:text-slate-200');
  text = text.replace(/text-slate-700\b(?! dark:)/g, 'text-slate-700 dark:text-slate-300');
  text = text.replace(/text-slate-600\b(?! dark:)/g, 'text-slate-600 dark:text-slate-400');
  text = text.replace(/text-slate-500\b(?! dark:)/g, 'text-slate-500 dark:text-slate-400');
  
  // Replace border colors
  text = text.replace(/border-slate-200\b(?! dark:)/g, 'border-slate-200 dark:border-slate-700');
  text = text.replace(/border-slate-300\b(?! dark:)/g, 'border-slate-300 dark:border-slate-700');
  text = text.replace(/border-gray-300\b(?! dark:)/g, 'border-gray-300 dark:border-slate-700');
  text = text.replace(/border-t\b(?! border-)/g, 'border-t dark:border-slate-700');
  text = text.replace(/border-b\b(?! border-)/g, 'border-b dark:border-slate-700');
  text = text.replace(/border-r\b(?! border-)/g, 'border-r dark:border-slate-700');
  text = text.replace(/border-l\b(?! border-)/g, 'border-l dark:border-slate-700');
  
  // Replace hover states
  text = text.replace(/hover:bg-slate-50\b(?! dark:)/g, 'hover:bg-slate-50 dark:hover:bg-slate-800');
  text = text.replace(/hover:bg-slate-100\b(?! dark:)/g, 'hover:bg-slate-100 dark:hover:bg-slate-800');
  
  // Fix nested borders like border border-slate-200
  text = text.replace(/border\b(?!-)(?! border-)/g, 'border dark:border-slate-700');
  
  return text;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const newContent = addDarkClasses(content);
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${file}`);
      }
    }
  }
}

processDirectory(componentsDir);

// Also process Login.tsx if it's there
console.log('Done modifying components.');
