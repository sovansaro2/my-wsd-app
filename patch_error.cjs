const fs = require('fs');
let index = fs.readFileSync('index.html', 'utf8');
const script = `
<script>
  window.addEventListener('error', function(event) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.zIndex = '999999';
    errorDiv.style.background = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px';
    errorDiv.style.width = '100%';
    errorDiv.style.whiteSpace = 'pre-wrap';
    errorDiv.innerText = "GLOBAL ERROR: " + event.error?.stack;
    document.body.appendChild(errorDiv);
  });
</script>
`;
if (!index.includes('GLOBAL ERROR')) {
  index = index.replace('<head>', '<head>' + script);
  fs.writeFileSync('index.html', index);
}
