const fs = require('fs');
const urls = require('./src/utils/all_images.json');

const images = urls.map(url => {
    let filename = url.split('/').pop().replace(/\.webp$/, '');
    
    // Clean up known filename noise to improve matching
    ['11zon', 'medium', '0', '1', '-2', '-1'].forEach(term => {
        let regex = new RegExp('_' + term + '(_|$)', 'g');
        filename = filename.replace(regex, '_');
        let regexDash = new RegExp('-' + term + '(-|$)', 'g');
        filename = filename.replace(regexDash, '-');
    });
    filename = filename.replace(/_[a-z0-9]{5,6}$/, ''); // typical hash length from cloudinary
    filename = filename.replace(/_+$/, ''); // trailing underscores
    
    return {
        url,
        normalized: filename.toLowerCase().replace(/[^a-z0-9]/g, '')
    };
});

function normalize(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findBestMatch(name, tag) {
    const n = normalize(name);
    const t = normalize(tag);
    
    const overrides = {
        'pgegroupelements': 'pge',
        'platinumgroupelements': 'pge',
        'platinumgroupelementspge': 'pge',
        'calciumcarbonatecalcite': 'calcite',
        'calciumcarbonate': 'calcite',
        'gypsumandanhydrite': 'gypsum',
        'gypsumanhydrite': 'gypsum',
        'haliterocksalt': 'halite',
        'preciousandsemipreciousstones': 'precioussemipreciousstones',
        'gravelsandaggregate': 'gravelsandaggregate',
        'coalandpeat': 'coal',
        'nephelinsyenite': 'nepheline',
        'pyrophylite': 'pyrophillite',
        'energy': 'energymachinesandequipments',
        'industrial': 'industrymachinesandequipments',
        'miningtools': 'mining',
        'miningandengineeringservices': 'miningservices',
        'mineraloreprocessingmachinery': 'mineralprocessing',
        'marbleandnaturalstone': 'marbleandnaturalstone',
        'nonmetallicindustrialminerals': 'nonmetallicindustrialminerals',
    };
    
    const searchN = overrides[n] || n;
    const searchT = overrides[t] || t;
    
    // 1. Exact match
    for (const img of images) {
        if ((searchN && img.normalized === searchN) || (searchT && img.normalized === searchT)) return img.url;
        // Singular/plural matching
        if (searchN && img.normalized === searchN.replace(/s$/, '')) return img.url;
        if (searchT && img.normalized === searchT.replace(/s$/, '')) return img.url;
        if (searchN && img.normalized.replace(/s$/, '') === searchN) return img.url;
        if (searchT && img.normalized.replace(/s$/, '') === searchT) return img.url;
        // Check without 'ore'
        if (searchN && img.normalized === searchN.replace(/ore$/, '')) return img.url;
        if (searchT && img.normalized === searchT.replace(/ore$/, '')) return img.url;
        if (searchN && img.normalized === searchN.replace(/ores$/, '')) return img.url;
        if (searchT && img.normalized === searchT.replace(/ores$/, '')) return img.url;
    }
    
    // 2. Contains match
    for (const img of images) {
        if (searchN && searchN.length > 3 && img.normalized.includes(searchN)) return img.url;
        if (searchT && searchT.length > 3 && img.normalized.includes(searchT)) return img.url;
        if (searchN && searchN.length > 3 && searchN.includes(img.normalized)) return img.url;
        if (searchT && searchT.length > 3 && searchT.includes(img.normalized)) return img.url;
    }

    return null;
}

const targetFiles = [
    './src/lib/constants/marketplace-categories.ts',
    './src/lib/marketplace-data.ts'
];

let replacedCount = 0;

targetFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');

    let currentName = '';
    let currentTag = '';
    
    const tokenRegex = /(name\s*:\s*['"]([^'"]+)['"])|(tag\s*:\s*['"]([^'"]+)['"])|(img\s*:\s*['"]([^'"]+)['"])/g;
    
    let newContent = '';
    let lastIndex = 0;
    
    let match;
    while ((match = tokenRegex.exec(content)) !== null) {
        if (match[1]) {
            currentName = match[2];
        } else if (match[3]) {
            currentTag = match[4];
        } else if (match[5]) {
            const currentImg = match[6];
            const bestImage = findBestMatch(currentName, currentTag);
            if (bestImage) {
                // safely replace only the image string within the matched text
                const replaceMatch = match[0].replace(currentImg, bestImage);
                newContent += content.slice(lastIndex, match.index) + replaceMatch;
                replacedCount++;
            } else {
                console.log(`[WARN] No match found for > Name: "${currentName}" Tag: "${currentTag}"`);
                newContent += content.slice(lastIndex, match.index) + match[0];
            }
            lastIndex = match.index + match[0].length;
            
            // clear context for next iteration
            currentName = '';
            currentTag = '';
        }
    }
    newContent += content.slice(lastIndex);
    
    fs.writeFileSync(file, newContent, 'utf-8');
});

console.log(`Done! Replaced ${replacedCount} images.`);
