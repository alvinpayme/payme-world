// IMPORTS
const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = "payme_super_secret_key_123";
const DB_FILE = path.join(__dirname, "payme_db.json");

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// DATABASE INITIALISATIE
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }));
}

function readDB() {
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// TEST ROUTE
app.get("/", (req, res) => {
    res.send("PayMe backend werkt");
});


// ⭐ REGISTER ROUTE
app.post("/auth/register", async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ error: "missing fields" });
    }

    const db = readDB();

    if (db.users.find(u => u.phone === phone)) {
        return res.status(400).json({ error: "phone already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.users.push({ phone, password: hashedPassword, balance: 0 });
    writeDB(db);

    res.status(201).json({ message: "Account succesvol aangemaakt" });
});


// ⭐ LOGIN ROUTE
app.post("/auth/login", async (req, res) => {
    const { phone, password } = req.body;

    const db = readDB();
    const user = db.users.find(u => u.phone === phone);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "onjuiste telefoon of wachtwoord" });
    }

    const token = jwt.sign({ phone }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ token });
});


// ⭐ AUTH ME ROUTE (Dashboard)
app.get("/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        const db = readDB();
        const user = db.users.find(u => u.phone === decoded.phone);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            phone: user.phone,
            balance: user.balance
        });

    } catch (err) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
});


// SERVER STARTEN
app.listen(PORT, () => {
    console.log(`Server draait op poort ${PORT}`);
});
