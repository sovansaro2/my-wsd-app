const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const loaderStyle = `
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #FAFAFA;
      }
      #initial-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        width: 100vw;
        font-family: system-ui, -apple-system, sans-serif;
        background-color: #FAFAFA;
      }
      @media (prefers-color-scheme: dark) {
        body { background-color: #0F172A; }
        #initial-loader { background-color: #0F172A; }
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(217, 119, 6, 0.2);
        border-top-color: #D97706;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .loading-text {
        font-size: 14px;
        font-weight: 600;
        color: #A1A1AA;
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: .5; }
      }
    </style>
`;

const loaderHtml = `
      <div id="initial-loader">
        <div class="spinner"></div>
        <div class="loading-text">កំពុងដំណើរការ...</div>
      </div>
`;

code = code.replace('</head>', loaderStyle + '  </head>');
code = code.replace('<div id="root"></div>', '<div id="root">' + loaderHtml + '    </div>');

fs.writeFileSync('index.html', code);
