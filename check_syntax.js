const fs = require('fs');
const js = fs.readFileSync('./js_file.js', 'utf8');

try {
  // Use a simple new Function to catch syntax errors
  new Function(js);
  console.log("Syntax is valid");
} catch (e) {
  console.error("Syntax error:", e);
}
