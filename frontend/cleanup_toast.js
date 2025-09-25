// Script để xóa tất cả toast trong frontend
const fs = require('fs');
const path = require('path');

const removeToastFromFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove toast imports
    content = content.replace(/import.*useToast.*from.*;\s*/g, '');
    content = content.replace(/import.*Toast.*from.*;\s*/g, '');
    
    // Remove toast declarations
    content = content.replace(/const.*toast.*=.*useToast\(\);\s*/g, '');
    content = content.replace(/const.*\{.*toast.*\}.*=.*useToast\(\);\s*/g, '');
    
    // Remove toast calls (simple ones)
    content = content.replace(/toast\(\{[^}]*\}\);\s*/g, '');
    
    // Remove multi-line toast calls
    content = content.replace(/toast\(\{[\s\S]*?\}\);\s*/g, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Cleaned: ${filePath}`);
  } catch (error) {
    console.log(`❌ Error cleaning ${filePath}:`, error.message);
  }
};

const cleanDirectory = (dirPath) => {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== '.git' && item !== 'dist') {
      cleanDirectory(fullPath);
    } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
      removeToastFromFile(fullPath);
    }
  });
};

// Start cleaning
console.log('🧹 Starting toast cleanup...');
cleanDirectory('./src');
console.log('🎉 Toast cleanup completed!');
