const fs = require('fs');
const path = require('path');

const files = [
  'd:\\Holicindo\\unit-passport-portal\\app\\frontend\\src\\app\\id\\[token]\\components\\IotTelemetryWidget.tsx',
  'd:\\Holicindo\\unit-passport-portal\\app\\frontend\\src\\app\\id\\[token]\\components\\IotHistoryWidget.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace background fallbacks
    content = content.replace(/var\(--neu-bg, #E8EAEE\)/g, 'var(--neu-bg, rgba(8,20,50,0.8))');
    
    // Replace intense white glows with very subtle ones or remove them
    content = content.replace(/rgba\(255,255,255,0\.75\)/g, 'rgba(255,255,255,0.04)');
    content = content.replace(/rgba\(255, 255, 255, 0\.75\)/g, 'rgba(255,255,255,0.04)');
    content = content.replace(/rgba\(255,255,255,0\.8\)/g, 'rgba(255,255,255,0.04)');
    content = content.replace(/rgba\(255, 255, 255, 0\.8\)/g, 'rgba(255,255,255,0.04)');
    content = content.replace(/rgba\(255,255,255,0\.7\)/g, 'rgba(255,255,255,0.04)');
    content = content.replace(/rgba\(255, 255, 255, 0\.7\)/g, 'rgba(255,255,255,0.04)');
    
    // Replace hardcoded #fff backgrounds in buttons
    content = content.replace(/background: activeTab === '[^']+' \? '[^']+' : '#fff'/g, (match) => {
      return match.replace("'#fff'", "'rgba(255,255,255,0.06)'");
    });

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${path.basename(file)}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
