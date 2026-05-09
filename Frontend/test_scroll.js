const fs = require('fs');
const file = '/Users/aryanbhoge/Desktop/Pillu-Repo/Frontend/Screens/Parent/Dashboard/sidebar.js';
let content = fs.readFileSync(file, 'utf8');

console.log(content.match(/<View style=\{\{\s*flex:\s*1,\s*\.\.\.Platform\.select\(\{ web: \{ overflow: 'hidden', height: '100%' \} \}\)\s*\}\}>/g));
