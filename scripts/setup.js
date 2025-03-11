const fs = require('fs').promises;
const path = require('path');

async function setup() {
    const dirs = [
        '.wwebjs_auth',
        'sessions',
        'stickers',
        'public'
    ];

    for (const dir of dirs) {
        try {
            await fs.mkdir(path.join(__dirname, '..', dir), { recursive: true });
            console.log(`✅ Directory created: ${dir}`);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                console.error(`❌ Error creating directory ${dir}:`, error);
            } else {
                console.log(`ℹ️ Directory already exists: ${dir}`);
            }
        }
    }
}

setup().catch(console.error); 