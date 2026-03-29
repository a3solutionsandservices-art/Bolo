const fs = require('fs');
const html = fs.readFileSync('voxtral.html', 'utf8');

const classRegex = /class="([^"]+)"/g;
let match;
const classes = new Set();
while ((match = classRegex.exec(html)) !== null) {
  match[1].split(/\s+/).forEach(c => c && classes.add(c));
}

console.log("=== UNIQUE CLASSES ===");
const classArr = Array.from(classes).sort();
console.log(classArr.filter(c => c.startsWith('bg-')).slice(0, 30).join(', '));
console.log(classArr.filter(c => c.startsWith('text-')).slice(0, 30).join(', '));
console.log(classArr.filter(c => c.startsWith('font-')).slice(0, 30).join(', '));
console.log(classArr.filter(c => c.startsWith('border-')).slice(0, 30).join(', '));
console.log(classArr.filter(c => c.startsWith('shadow-')).slice(0, 30).join(', '));
console.log(classArr.filter(c => c.startsWith('rounded-')).slice(0, 30).join(', '));

// Let's find specific structural classes like "nav", "card", "button", "btn"
console.log("=== COMPONENT CLASSES ===");
console.log(classArr.filter(c => c.includes('btn') || c.includes('button') || c.includes('card') || c.includes('nav')).join(', '));
