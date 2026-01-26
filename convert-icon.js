const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function convertIcon() {
  try {
    const buf = await pngToIco.default('logo.png');
    fs.writeFileSync(path.join('build', 'icon.ico'), buf);
    console.log('Icon converted successfully: build/icon.ico');
  } catch (error) {
    console.error('Error converting icon:', error);
    process.exit(1);
  }
}

convertIcon();
