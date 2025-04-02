const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const chromeManifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
const firefoxManifest = JSON.parse(fs.readFileSync('./manifest-firefox.json', 'utf8'));

if (!fs.existsSync('./build')) {
  fs.mkdirSync('./build');
}

function createBrowserPackage(browser, manifest) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(`./build/outsmartbook-${browser}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`${browser} package created: ${archive.pointer()} total bytes`);
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
    
    const filesToInclude = ['background.js', 'content.js', 'content.css', 'icon.png'];
    filesToInclude.forEach(file => {
      if (fs.existsSync(`./${file}`)) {
        archive.file(file, { name: file });
      } else {
        console.error(`Warning: ${file} not found`);
      }
    });
    
    archive.finalize();
  });
}

async function build() {
  try {
    await createBrowserPackage('chrome', chromeManifest);
    await createBrowserPackage('firefox', firefoxManifest);
    console.log('Build completed successfully!');
    console.log('Chrome extension available at: ./build/outsmartbook-chrome.zip');
    console.log('Firefox extension available at: ./build/outsmartbook-firefox.zip');
  } catch (error) {
    console.error('Build failed:', error);
  }
}

build();