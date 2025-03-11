const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const moment = require('moment');
const app = express();
require('dotenv').config();

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');

// Global variables for web interface
let qrCode = null;
let botStatus = 'Initializing...';
let lastError = null;

// Fungsi untuk logging
function logMessage(type, message, error = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
    if (error) {
        console.error(`[${timestamp}] [ERROR] `, error);
    }
}

// Express routes
app.get('/', (req, res) => {
    res.render('index', { 
        qrCode,
        botStatus,
        lastError
    });
});

app.get('/status', (req, res) => {
    res.json({
        status: botStatus,
        qrCode,
        lastError
    });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    logMessage('SERVER', `Server berjalan di port ${port}`);
});

// Dynamic Commands
const dynamicCommands = {
    laporan1: 'praktikum pertemuan pertama belum diadakan',
    laporan2: 'praktikum pertemuan kedua belum diadakan',
    laporan3: 'praktikum pertemuan ketiga belum diadakan',
    laporan4: 'praktikum pertemuan keempat belum diadakan',
    laporan5: 'praktikum pertemuan kelima belum diadakan',
    laporan6: 'praktikum pertemuan keenam belum diadakan',
    laporan7: 'praktikum pertemuan ketujuh belum diadakan',
    asistensi1: 'asistensi pertemuan pertama belum diadakan',
    asistensi2: 'asistensi pertemuan kedua belum diadakan',
    asistensi3: 'asistensi pertemuan ketiga belum diadakan',
    asistensi4: 'asistensi pertemuan keempat belum diadakan',
    asistensi5: 'asistensi pertemuan kelima belum diadakan',
    asistensi6: 'asistensi pertemuan keenam belum diadakan',
    asistensi7: 'asistensi pertemuan ketujuh belum diadakan',
    tugasakhir: 'link tugas akhir belum tersedia',
    jadwal: 'https://s.id/kapanpraktikum',
    nilai: 'belum bang.'
};

const ADMIN_NUMBERS = [
    '6287781009836@c.us'
];

const scheduledMessages = new Map();
const SCHEDULES_FILE = path.join(__dirname, 'sessions', 'schedules.json');

// Utility function for retrying operations
async function retryOperation(operation, maxRetries = 3, delay = 3000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Function to save schedules to file
async function saveSchedules() {
    const schedulesData = Array.from(scheduledMessages.entries()).map(([id, schedule]) => ({
        id,
        groupId: schedule.groupId,
        dateTime: schedule.dateTime.toISOString(),
        message: schedule.message
    }));
    
    try {
        await fs.writeFile(SCHEDULES_FILE, JSON.stringify(schedulesData, null, 2));
    } catch (error) {
        console.error('Error menyimpan jadwal:', error);
    }
}

// Function to load schedules from file
async function loadSchedules() {
    try {
        const exists = await fs.access(SCHEDULES_FILE).then(() => true).catch(() => false);
        if (!exists) {
            return;
        }

        const data = await fs.readFile(SCHEDULES_FILE, 'utf8');
        const schedulesData = JSON.parse(data);
        
        for (const schedule of schedulesData) {
            const dateTime = new Date(schedule.dateTime);
            if (dateTime > new Date()) {
                await scheduleMessage(schedule.groupId, dateTime, schedule.message);
            }
        }
    } catch (error) {
        console.error('Error memuat jadwal:', error);
    }
}

// Function to schedule a message
async function scheduleMessage(groupId, dateTime, message) {
    const now = new Date();
    const scheduledTime = new Date(dateTime);
    
    if (scheduledTime <= now) {
        throw new Error('Waktu yang dijadwalkan harus di masa depan');
    }

    const scheduleId = `${groupId}_${scheduledTime.getTime()}`;
    const timeoutId = setTimeout(async () => {
        try {
            const chat = await client.getChatById(groupId);
            if (chat && chat.isGroup) {
                await chat.sendMessage(message);
                console.log(`Pesan terjadwal terkirim ke ${groupId}`);
            }
            scheduledMessages.delete(scheduleId);
            await saveSchedules();
        } catch (error) {
            console.error('Error mengirim pesan terjadwal:', error);
        }
    }, scheduledTime.getTime() - now.getTime());

    scheduledMessages.set(scheduleId, {
        groupId,
        dateTime: scheduledTime,
        message,
        timeoutId
    });
    await saveSchedules();
    return scheduleId;
}

// Function to format date for display
function formatDateTime(date) {
    moment.locale('id');
    return moment(date).format('DD MMMM YYYY HH:mm');
}

// Handle admin commands
async function handleAdminCommand(msg) {
    const sender = msg.from;
    
    if (!ADMIN_NUMBERS.includes(sender)) {
        return false;
    }

    const command = msg.body.toLowerCase();
    const parts = msg.body.split(' ');

    if (command.startsWith('!update ')) {
        const commandToUpdate = parts[1].toLowerCase();
        const newValue = parts.slice(2).join(' ');
        
        if (dynamicCommands.hasOwnProperty(commandToUpdate)) {
            dynamicCommands[commandToUpdate] = newValue;
            await msg.reply(`✅ Perintah ${commandToUpdate} telah diperbarui menjadi:\n${newValue}`);
            return true;
        } else {
            await msg.reply('❌ Nama perintah tidak valid. Perintah yang tersedia:\n' + Object.keys(dynamicCommands).join(', '));
            return true;
        }
    }
    
    else if (command.startsWith('!schedule ')) {
        try {
            const groupId = parts[1];
            const dateStr = parts[2];
            const timeStr = parts[3];
            const message = parts.slice(4).join(' ');
            
            if (!groupId || !dateStr || !timeStr || !message) {
                await msg.reply('Format: !schedule <groupId> <YYYY-MM-DD> <HH:mm> <pesan>');
                return true;
            }

            const dateTime = moment(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm').toDate();
            const scheduleId = await scheduleMessage(groupId, dateTime, message);
            
            await msg.reply(`✅ Pesan dijadwalkan untuk ${formatDateTime(dateTime)}\nID Jadwal: ${scheduleId}`);
        } catch (error) {
            await msg.reply(`❌ Error menjadwalkan pesan: ${error.message}`);
        }
        return true;
    }
    
    else if (command === '!listschedules') {
        if (scheduledMessages.size === 0) {
            await msg.reply('Tidak ada pesan terjadwal.');
            return true;
        }

        let response = '*Daftar Pesan Terjadwal:*\n\n';
        for (const [id, schedule] of scheduledMessages) {
            response += `ID: ${id}\nGrup: ${schedule.groupId}\nWaktu: ${formatDateTime(schedule.dateTime)}\nPesan: ${schedule.message}\n\n`;
        }
        await msg.reply(response);
        return true;
    }
    
    else if (command.startsWith('!cancelschedule ')) {
        const scheduleId = parts[1];
        const schedule = scheduledMessages.get(scheduleId);
        
        if (!schedule) {
            await msg.reply('❌ Jadwal tidak ditemukan.');
            return true;
        }

        clearTimeout(schedule.timeoutId);
        scheduledMessages.delete(scheduleId);
        await saveSchedules();
        await msg.reply(`✅ Pesan terjadwal dibatalkan: ${scheduleId}`);
        return true;
    }

    else if (command === '!showcommands') {
        let response = '*Nilai Perintah Saat Ini:*\n\n';
        for (const [cmd, value] of Object.entries(dynamicCommands)) {
            response += `*${cmd}:* ${value}\n`;
        }
        await msg.reply(response);
        return true;
    }

    return false;
}

// Inisialisasi WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, '.wwebjs_auth')
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    },
    qrMaxRetries: 5,
    restartOnAuthFail: true
});

// Event saat QR code tersedia
client.on('qr', async (qr) => {
    try {
        qrCode = await qrcode.toDataURL(qr);
        botStatus = 'QR Code siap untuk di-scan';
        logMessage('QR', 'QR Code baru telah dibuat');
    } catch (error) {
        logMessage('ERROR', 'Error generating QR code', error);
        lastError = error.message;
    }
});

// Event saat client siap
client.on('ready', () => {
    botStatus = 'Bot WhatsApp sudah siap!';
    qrCode = null;
    lastError = null;
    logMessage('READY', botStatus);
    loadSchedules();
});

client.on('authenticated', () => {
    logMessage('AUTH', 'Bot berhasil diautentikasi');
});

client.on('auth_failure', (error) => {
    logMessage('AUTH_FAIL', 'Autentikasi gagal', error);
    lastError = error.message;
});

// Event saat menerima pesan
client.on('message', async msg => {
    try {
        logMessage('MESSAGE', `Pesan diterima dari ${msg.from}: ${msg.body}`);

        // Check for admin commands first
        if (await handleAdminCommand(msg)) {
            logMessage('ADMIN', `Perintah admin dijalankan: ${msg.body}`);
            return;
        }

        const command = msg.body.toLowerCase();
        logMessage('COMMAND', `Menjalankan perintah: ${command}`);

        switch (command) {
            case '!software':
                await retryOperation(() => {
                    logMessage('REPLY', 'Mengirim link software');
                    return msg.reply('https://s.id/softwarepraktikum');
                }, 3, 3000);
                break;
            case '!template':
                await retryOperation(() => msg.reply('https://s.id/templatebdX'), 3, 3000);
                break;
            case '!asistensi':
                await retryOperation(() => msg.reply('Untuk melihat jadwal asistensi gunakan command !asistensi1 sampai !asistensi7 sesuai dengan pertemuan yang ingin dilihat'), 3, 3000);
                break;
            case '!tugasakhir':
                await retryOperation(() => msg.reply(dynamicCommands.tugasakhir), 3, 3000);
                break;
            case '!jadwal':
            case 'kapan praktikum?':
                await retryOperation(() => msg.reply(dynamicCommands.jadwal), 3, 3000);
                break;
            case '!nilai':
            case 'nilai praktikum?':
                await retryOperation(() => msg.reply(dynamicCommands.nilai), 3, 3000);
                break;
            case '!sesi':
            case 'sesi praktikum?':
                await retryOperation(() => msg.reply('Praktikum sesi satu : 15:15 - 16:05\nPraktikum sesi dua : 16:10 - 17:00\nPraktikum sesi tiga : 20:00 - 20:50'), 3, 3000);
                break;
            case '!laporan':
            case 'bagaimana cara upload laporan?':
                await retryOperation(() => msg.reply('Untuk mengupload laporan:\n1. ubah file word laporan menjadi pdf\n2. cek link upload laporan sesuai dengan pertemuan ke berapa command contoh !laporan1\n3. klik link upload laporan\n4. upload laporan\n5. Tunggu sampai kelar\nJANGAN SAMPAI MENGUMPULKAN LAPORAN TERLAMBAT -5%!!!'), 3, 3000);
                break;
            case '!help':
            case '!bantuan':
                await retryOperation(() => msg.reply(`Daftar perintah yang tersedia:
!jadwal - Informasi jadwal praktikum
!laporan - Cara upload laporan
!sesi - Informasi sesi praktikum
!nilai - Informasi nilai praktikum
!izin - Informasi izin tidak hadir praktikum
!asistensi - Informasi jadwal asistensi
!software - Link download software praktikum
!template - Link template laporan
!tugasakhir - Informasi tugas akhir`), 3, 3000);
                break;
            case '!izin':
                try {
                    await msg.reply('Silahkan izin jika berkendala hadir, dimohon segera hubungi saya');
                    const sticker = MessageMedia.fromFilePath(path.join(__dirname, 'stickers', 'izin.jpeg'));
                    await msg.reply(sticker, null, { sendMediaAsSticker: true });
                } catch (error) {
                    console.error('Error mengirim sticker:', error);
                    msg.reply('❌ Maaf, terjadi kesalahan saat mengirim sticker');
                }
                break;
            default:
                if (command.startsWith('!asistensi') && /^!asistensi[1-7]$/.test(command)) {
                    await retryOperation(() => msg.reply(dynamicCommands[command.substring(1)]), 3, 3000);
                } else if (command.startsWith('!laporan') && /^!laporan[1-7]$/.test(command)) {
                    await retryOperation(() => msg.reply(dynamicCommands[command.substring(1)]), 3, 3000);
                }
                break;
        }
    } catch (error) {
        logMessage('ERROR', 'Error dalam menangani pesan', error);
        lastError = error.message;
        await msg.reply('Maaf, terjadi kesalahan dalam memproses perintah. Silakan coba lagi.');
    }
});

// Event saat client terputus
client.on('disconnected', (reason) => {
    botStatus = `Bot terputus: ${reason}`;
    logMessage('DISCONNECT', botStatus);
    // Coba reconnect setelah disconnect
    setTimeout(() => {
        logMessage('RECONNECT', 'Mencoba menghubungkan kembali...');
        client.initialize();
    }, 5000);
});

// Initialize client with error handling
try {
    logMessage('INIT', 'Memulai inisialisasi bot...');
    client.initialize();
} catch (error) {
    logMessage('INIT_ERROR', 'Error saat inisialisasi bot', error);
} 