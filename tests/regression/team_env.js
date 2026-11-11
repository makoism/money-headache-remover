const fs = require('fs');
const header = fs.readFileSync('/tmp/team_cur.js', 'utf8').split('\n').slice(0, 28).join('\n');
