const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let original = content;

    content = content.replace(/text-\[9px\]/g, 'text-[10px]');
    content = content.replace(/text-\[10px\]/g, 'text-xs');
    content = content.replace(/text-\[11px\]/g, 'text-xs');
    content = content.replace(/text-\[13px\]/g, 'text-sm');
    content = content.replace(/text-\[15px\]/g, 'text-sm');

    // Replace style={{ backdropFilter: "blur(..." }} entirely if it's the only prop inside style={}
    content = content.replace(/style=\{\{\s*backdropFilter:\s*['"]blur\(([0-9]+)px\)['"]\s*\}\}/g, (match, pxStr) => {
        const px = parseInt(pxStr);
        if (px >= 12 && px <= 20) return 'className="backdrop-blur-xl"';
        if (px >= 24 && px <= 32) return 'className="backdrop-blur-2xl"';
        if (px >= 40) return 'className="backdrop-blur-3xl"';
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf-8');
        console.log('Updated ' + file);
    }
});
