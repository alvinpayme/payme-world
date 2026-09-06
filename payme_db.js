const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'payme_db.json');

// Databasebestand aanmaken als het niet bestaat
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
}

// Alle gebruikers ophalen
function getAllUsers() {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

// Alle gebruikers opslaan
function saveAllUsers(users) {
    fs.writeFileSync(dbPath, JSON.stringify(users, null, 2));
}

module.exports = {

    // 1. Gebruiker opslaan (Registreren)
    saveUser: function(userData, callback) {
        try {
            const users = getAllUsers();

            // Check of telefoonnummer al bestaat
            const exists = users.find(u => u.phone_number === userData.phone_number);
            if (exists) {
                return callback(new Error("Nummer bestaat al"), null);
            }

            // Nieuwe gebruiker aanmaken
            const newUser = {
                id: Date.now(),
                email: userData.email,
                password: userData.password, // al gehashed
                phone_number: userData.phone_number,
                balance: userData.balance || 500.00
            };

            users.push(newUser);
            saveAllUsers(users);

            callback(null, newUser);

        } catch (err) {
            callback(err, null);
        }
    },

    // 2. Gebruiker zoeken op telefoonnummer (Inloggen)
    getUserByPhone: function(phone_number, callback) {
        try {
            const users = getAllUsers();
            const user = users.find(u => u.phone_number === phone_number);
            callback(null, user || null);
        } catch (err) {
            callback(err, null);
        }
    },

    // 3. Gebruiker zoeken op ID (Transacties)
    getUserById: function(id, callback) {
        try {
            const users = getAllUsers();
            const user = users.find(u => u.id === id);
            callback(null, user || null);
        } catch (err) {
            callback(err, null);
        }
    },

    // 4. Overboeking uitvoeren
    executeTransfer: function(sender_id, recipient_phone, amount, fee, callback) {
        try {
            const users = getAllUsers();

            const sender = users.find(u => u.id === sender_id);
            const recipient = users.find(u => u.phone_number === recipient_phone);

            if (!sender) return callback(new Error("Verzender niet gevonden"), null);
            if (!recipient) return callback(new Error("Ontvanger niet gevonden"), null);

            // Saldo aanpassen
            sender.balance -= (amount + fee);
            recipient.balance += amount;

            saveAllUsers(users);

            callback(null, { success: true });

        } catch (err) {
            callback(err, null);
        }
    }
};