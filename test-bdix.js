const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join('/home/nobojit/Downloads/bdix-ftp-server-main', 'index.html'), 'utf8');
const js = fs.readFileSync(path.join('/home/nobojit/Downloads/bdix-ftp-server-main', 'script.js'), 'utf8');

// Make init robust against late execution
const modifiedJs = js.replace(
    /document\.addEventListener\('DOMContentLoaded', function \(\) \{/,
    `(function() {
        console.log('Script executing, readyState=' + document.readyState);
        function init() {
            console.log('init() running');
`
).replace(
    'function toggleScanning() {',
    'function toggleScanning() { console.log("toggleScanning CALLED, scanningActive=" + scanningActive);'
);

// Close the IIFE wrapper
const modifiedJs2 = modifiedJs.replace(
    /\}\);$/,
    '        } // end init\n    } // end IIFE\n})();'
);

const modifiedHtml = html.replace(
    '<script src="script.js"></script>',
    '<script>' + modifiedJs2 + '</script>'
);

const dom = new JSDOM(modifiedHtml, {
    url: 'http://localhost:8082/',
    pretendToBeVisual: true,
    beforeParse(window) {
        window.fetch = async () => ({ text: async () => 'http://example.com\nhttp://example.org\n' });
        window.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        window.URL.createObjectURL = () => 'blob:test';
        window.URL.revokeObjectURL = () => {};
        window.Blob = class { constructor() {} };
        window.ClipboardItem = class { constructor() {} };
        window.Audio = class { play() {} };
        window.navigator.serviceWorker = { register: async () => {}, addEventListener: () => {} };
        window.requestAnimationFrame = (cb) => setTimeout(cb, 50);
        window.cancelAnimationFrame = (id) => clearTimeout(id);
    }
});

setTimeout(() => {
    const startBtn = dom.window.document.getElementById('startStopBtn');
    console.log('Button text:', startBtn.textContent.trim());
    startBtn.click();
}, 500);

setTimeout(() => {
    const startBtn = dom.window.document.getElementById('startStopBtn');
    console.log('Button text after click:', startBtn.textContent.trim());
    console.log('onlinePill:', dom.window.document.getElementById('onlinePill').textContent);
}, 1200);
