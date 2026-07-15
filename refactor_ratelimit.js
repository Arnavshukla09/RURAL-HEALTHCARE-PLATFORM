const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('app/api/**/*.ts');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Search and replace `if (!rateLimit(ip...))` with `if (!(await rateLimit(ip...)))`
  const newContent = content.replace(/if\s*\(!rateLimit\((.*?)\)\)/g, 'if (!(await rateLimit($1)))');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
}
