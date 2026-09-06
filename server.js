const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const db = require('./payme_db.js'); // ✔ correcte bestandsnaam

app.use(express.json());
app.use(cors());

// ✔ Zorgt dat HTML-bestanden direct geladen worden
app.use(express.static(path.join(__dirname)));

const JWT_SECRET = process.env.JWT_SECRET || 'JE_GEHEIME_SLEUTEL_VOOR_PAYME';

// ─── TOKEN CHECK ───
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Geen toegang." });
    }

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({ error: "Token ongeldig." });
        }
        req.user = decodedUser;
        next();
    });
}

// ─── HTML ROUTES ───
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ─── LOGIN ───
app.post('/login', async (req, res) => {
    const { phone_number, password } = req.body;

    if (!phone_number || !password) {
        return res.status(400).json({ error: "Velden verplicht." });
    }

    db.getUserByPhone(phone_number, async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: "Gebruiker niet gevonden." });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: "Onjuist wachtwoord." });
        }

        const token = jwt.sign(
            { id: user.id, phone_number: user.phone_number },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: "Succesvol ingelogd!",
            token,
            balance: user.balance
        });
    });
});

// ─── REGISTREREN ───
app.post('/register', async (req, res) => {
    const { email, password, phone_number } = req.body;

    if (!email || !password || !phone_number) {
        return res.status(400).json({ error: "Velden verplicht." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.saveUser(
            { email, password: hashedPassword, phone_number, balance: 500.00 },
            (err, result) => {
                if (err) {
                  if (err) {
    console.error("Echte database fout:", err);
    return res.status(500).json({ error: "Database fout." });
}
                    return res.status(500).json({ error: "Database fout." });
                }
                res.status(201).json({ message: "Geregistreerd!" });
            }
        );

    } catch (error) {
        res.status(500).json({ error: "Serverfout." });
    }
});

// ─── GELD OVERMAKEN ───
app.post('/transfer', authenticateToken, (req, res) => {
    const { recipient_phone, amount } = req.body;
    const sender_id = req.user.id;

    if (!recipient_phone || !amount || amount <= 0) {
        return res.status(400).json({ error: "Ongeldige invoer." });
    }

    db.getUserById(sender_id, (err, sender) => {
        if (err || !sender) {
            return res.status(500).json({ error: "Verzender niet gevonden." });
        }

        const fee = amount * 0.01;
        const totalDeduction = amount + fee;

        if (sender.balance < totalDeduction) {
            return res.status(400).json({ error: "Onvoldoende saldo incl. 1% kosten." });
        }

        db.executeTransfer(sender_id, recipient_phone, amount, fee, (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Transactie mislukt." });
            }

            res.json({
                message: "Transactie succesvol!",
                sentAmount: amount,
                feeCharged: fee,
                newBalance: sender.balance - totalDeduction
            });
        });
    });
});

// ─── SERVER START ───
// —— SERVER START ——
const PORT = 3005;

app.listen(PORT, () => {
    console.log(`Server draait succesvol op http://localhost:${PORT}`);
});