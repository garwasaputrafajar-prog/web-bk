const fs = require('fs'); 
const html = fs.readFileSync('index.html', 'utf8'); 
const startIndex = html.indexOf('<script type="text/babel">');
const endIndex = html.lastIndexOf('</script>');
const script = html.substring(startIndex + 26, endIndex); 
fs.writeFileSync('test.jsx', script);
