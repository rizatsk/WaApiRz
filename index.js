const { Client, LocalAuth } = require('whatsapp-web.js');
const qrCode  = require('qrcode');
const SocketIo = require('socket.io');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = SocketIo(server);

const client = new Client({
    authStrategy: new LocalAuth({}),
    puppeteer: {
        headless: true,
    }
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname});
})

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    } else if (msg.body == 'sayang') {
        msg.reply('Apa sayang ?');
    } else if (msg.body == 'bi') {
        msg.reply('Apa cibi jelek ?');
    }
})

client.initialize();


// Socket IO
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.emit('message', 'Connecting...');

    client.on('qr', (qr) => {
        console.log('kode qr');
        qrCode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('message', 'QR Code received, scan please');
        })
    });

    client.on('ready', () => {
        socket.emit('ready', 'Whatshapp is ready');
        socket.emit('message', 'Whatshapp is ready');
    })

    client.on('authenticated', () => {
        socket.emit('authenticated', 'Whatshapp is authenticated');
        socket.emit('message', 'Whatshapp is authenticated');
        console.log('AUTHENTICATED');
    })

    client.on('disconnected', (reason) => {
        console.log('User disconnected');
        socket.emit('logout');
        client.initialize();
    });
});

// Send message
app.post('/send-message', (req, res) => {
    const number = req.body.number;
    const message = req.body.message;

    client.sendMessage(number, message).then(response => {
        res.status(200).json({
            status: 'success',
            message: 'Pesan berhasil dikirimkan'

        })
    }).catch(err => {
        res.status(500).json({
            status: 'fail',
            message: 'Pesan Gagal Dikirimkan'
        })
    });
})

server.listen(3000, function() {
    console.log('Server running in localhost:3000');
});