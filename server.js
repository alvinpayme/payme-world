import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = "./payme_db.json";
const JWT_SECRET = "PAYMEWORLD_SECRET_KEY";

// Database lezen
function readDB() {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

// Database schrijven
function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// REGISTER
app.post("/auth/register", async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ error: "missing fields" });
    }

    const db = readDB();

    if (db.users.some(u => u.phone === phone)) {
        return res.status(400).json({ error: "phone already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.users.push({
        phone,
        password: hashedPassword,
        balance: 0
    });

    writeDB(db);

    res.status(201).json({ message: "Account succesvol aangemaakt" });
});

// LOGIN
app.post("/auth/login", async (req, res) => {
    const { phone, password } = req.body;

    const db = readDB();
    const user = db.users.find(u => u.phone === phone);

    if (!user) {
        return res.status(400).json({ error: "onjuiste telefoon of wachtwoord" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return res.status(400).json({ error: "onjuiste telefoon of wachtwoord" });
    }

    const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token });
});

// AUTH CHECK
app.get("/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "no token" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = readDB();
        const user = db.users.find(u => u.phone === decoded.phone);

        if (!user) {
            return res.status(404).json({ error: "user not found" });
        }

        res.json({
            phone: user.phone,
            balance: user.balance
        });

    } catch (err) {
        res.status(401).json({ error: "invalid token" });
    }
});

app.listen(10000, () => {
    console.log("Server draait op poort 10000");
});
