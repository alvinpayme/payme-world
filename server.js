const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3005;
const SECRET_KEY = 'payme_super_secret_key_123';
const DB_FILE = path.join(__dirname, 'payme_db.json');

// HIER STAAT DE WAARDEVOLLE UPDATE: Poort openzetten voor je website!
app.use(cors());
app.use(express.json());

// Zorg dat de database bestaat
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], transactions: [] }, null, 2));
}

function readDB() {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// REGISTREREN
app.post('/register', async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'Telefoonnummer en wachtwoord verplicht.' });

    const db = readDB();
    if (db.users.find(u => u.phone === phone)) return res.status(400).json({ error: 'Dit nummer bestaat al.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.users.push({ phone, password: hashedPassword, balance: 100.00 }); // Iedereen krijgt 100 SRD starttegoed om te testen!
    writeDB(db);

    res.status(201).json({ message: 'Account succesvol aangemaakt!' });
});

// INLOGGEN
app.post('/login', async (req, res) => {
    const { phone, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.phone === phone);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Onjuist telefoonnummer of wachtwoord.' });
    }

    const token = jwt.sign({ phone }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

// MIDDELWARE VOOR BEVEILIGING
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// SALDO OPHALEN
app.get('/balance', authenticateToken, (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.phone === req.user.phone);
    res.json({ balance: user.balance });
});

// GELD OVERMAKEN (P2P EN FINTECH ENGINE)
app.post('/transfer', authenticateToken, (req, res) => {
    const { recipient_phone, amount, currency } = req.body;
    const transferAmount = parseFloat(amount);

    if (!recipient_phone || transferAmount <= 0) return res.status(400).json({ error: 'Ongeldige gegevens.' });

    const db = readDB();
    const sender = db.users.find(u => u.phone === req.user.phone);
    const recipient = db.users.find(u => u.phone === recipient_phone);

    if (!recipient) return res.status(404).json({ error: 'Ontvanger niet gevonden in Payme World.' });
    if (sender.phone === recipient.phone) return res.status(400).json({ error: 'Je kunt niet naar jezelf overmaken.' });
    if (sender.balance < transferAmount) return res.status(400).json({ error: 'Saldo ontoereikend.' });

    // Transactie uitvoeren
    sender.balance -= transferAmount;
    recipient.balance += transferAmount;

    db.transactions.push({
        from: sender.phone,
        to: recipient.phone,
        amount: transferAmount,
        currency,
        date: new Date()
    });

    writeDB(db);
    res.json({ message: 'Geld succesvol overgemaakt!' });
});

// Start de motor!
app.listen(PORT, () => {
    console.log(`Server draait succesvol op poort ${PORT}`);
});
