// =====================================================
// TASKLISTER BACKEND API - Node.js + Express + PostgreSQL
// =====================================================

// Ładowanie zmiennych środowiskowych z pliku .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// =====================================================
// KONFIGURACJA POSTGRESQL
// =====================================================

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'tasklister',
    password: process.env.DB_PASSWORD || 'your_password',
    port: process.env.DB_PORT || 5432,
});

// Test połączenia z bazą danych
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Błąd połączenia z bazą danych:', err.message);
        console.error('💡 Sprawdź konfigurację w pliku .env:');
        console.error('   - DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT');
        // Usunięto błędy specyficzne dla lokalnego dev, ponieważ w Dockerze będą inne
    } else {
        console.log('✅ Połączono z bazą danych PostgreSQL');
        console.log(`   Baza: ${process.env.DB_NAME || 'tasklister'}`);
        console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    }
});

// =====================================================
// MIDDLEWARE
// =====================================================

// *** POCZĄTEK MODYFIKACJI CORS ***
// Konfiguracja CORS na podstawie Twojego pliku .env
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    console.warn('⚠️ OSTRZEŻENIE: Serwer działa w trybie produkcyjnym, ale zmienna ALLOWED_ORIGINS nie jest ustawiona. Domyślnie CORS jest wyłączony.');
}

const corsOptions = {
    origin: (origin, callback) => {
        // Pozwól na zapytania z dozwolonych domen (lub jeśli origin nie istnieje, np. z Postmana)
        // W trybie innym niż 'production' pozwoli na wszystko.
        if (process.env.NODE_ENV !== 'production' || !origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`Odrzucono zapytanie CORS z domeny: ${origin}`);
            callback(new Error('Niedozwolone przez CORS'));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));

// Obsługa zapytań OPTIONS (pre-flight)
app.options('*', cors(corsOptions));
// *** KONIEC MODYFIKACJI CORS ***


app.use(express.json());

// Middleware do logowania requestów
app.use((req, res, next) => {
    // Loguj tylko jeśli nie jest to tryb testowy
    if (process.env.NODE_ENV !== 'test') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

// Middleware do weryfikacji JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Brak tokenu autoryzacji' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Nieprawidłowy token' });
        }
        req.user = user;
        next();
    });
};

// =====================================================
// FUNKCJE POMOCNICZE
// =====================================================

// Generowanie slug z nazwy firmy
function generateSlug(companyName) {
    return companyName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// =====================================================
// ENDPOINTY API
// =====================================================

// ----- REJESTRACJA NOWEJ INSTANCJI (ADMIN) -----
app.post('/api/register-instance', async (req, res) => {
    const { companyName, adminUsername, adminPassword } = req.body;

    if (!companyName || !adminUsername || !adminPassword) {
        return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Generuj slug
        let slug = generateSlug(companyName);
        let counter = 1;

        // Sprawdź unikalność slug
        while (true) {
            const checkSlug = await client.query(
                'SELECT id FROM instances WHERE slug = $1',
                [slug]
            );
            if (checkSlug.rows.length === 0) break;
            slug = generateSlug(companyName) + '-' + counter;
            counter++;
        }

        // Utwórz instancję
        const instanceResult = await client.query(
            'INSERT INTO instances (slug, company_name) VALUES ($1, $2) RETURNING id, slug',
            [slug, companyName]
        );
        const instanceId = instanceResult.rows[0].id;
        const finalSlug = instanceResult.rows[0].slug;

        // Hash hasła admina
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        // Utwórz konto admina
        const userResult = await client.query(
            'INSERT INTO users (instance_id, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [instanceId, adminUsername, passwordHash, 'admin']
        );

        await client.query('COMMIT');

        // Wygeneruj token JWT
        const token = jwt.sign(
            { userId: userResult.rows[0].id, instanceId, role: 'admin', username: adminUsername },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Instancja utworzona pomyślnie',
            slug: finalSlug,
            url: `/${finalSlug}`,
            token,
            user: {
                id: userResult.rows[0].id,
                username: adminUsername,
                role: 'admin'
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Błąd podczas tworzenia instancji:', error);
        res.status(500).json({ error: 'Błąd serwera podczas tworzenia instancji' });
    } finally {
        client.release();
    }
});

// ----- LOGOWANIE ADMINA -----
app.post('/api/login/admin', async (req, res) => {
    const { slug, username, password } = req.body;

    if (!slug || !username || !password) {
        return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
    }

    try {
        // Znajdź instancję
        const instanceResult = await pool.query(
            'SELECT id FROM instances WHERE slug = $1',
            [slug]
        );

        if (instanceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Instancja nie istnieje' });
        }

        const instanceId = instanceResult.rows[0].id;

        // Znajdź admina
        const userResult = await pool.query(
            'SELECT id, username, password_hash, role FROM users WHERE instance_id = $1 AND username = $2 AND role = $3',
            [instanceId, username, 'admin']
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
        }

        const user = userResult.rows[0];

        // Sprawdź hasło
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
        }

        // Aktualizuj last_login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Wygeneruj token
        const token = jwt.sign(
            { userId: user.id, instanceId, role: user.role, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Błąd podczas logowania admina:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// ----- LOGOWANIE UŻYTKOWNIKA (TYLKO NICKNAME) -----
app.post('/api/login/user', async (req, res) => {
    const { slug, username } = req.body;

    if (!slug || !username) {
        return res.status(400).json({ error: 'Slug i nazwa użytkownika są wymagane' });
    }

    try {
        // Znajdź instancję
        const instanceResult = await pool.query(
            'SELECT id FROM instances WHERE slug = $1',
            [slug]
        );

        if (instanceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Instancja nie istnieje' });
        }

        const instanceId = instanceResult.rows[0].id;

        // Sprawdź czy użytkownik istnieje
        let userResult = await pool.query(
            'SELECT id, username, role FROM users WHERE instance_id = $1 AND username = $2',
            [instanceId, username]
        );

        let userId;
        if (userResult.rows.length === 0) {
            // Utwórz nowego użytkownika
            const newUser = await pool.query(
                'INSERT INTO users (instance_id, username, role) VALUES ($1, $2, $3) RETURNING id',
                [instanceId, username, 'user']
            );
            userId = newUser.rows[0].id;
        } else {
            userId = userResult.rows[0].id;
        }

        // Aktualizuj last_login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [userId]
        );

        // Wygeneruj token
        const token = jwt.sign(
            { userId, instanceId, role: 'user', username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: userId,
                username,
                role: 'user'
            }
        });

    } catch (error) {
        console.error('Błąd podczas logowania użytkownika:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// ----- POBIERZ WSZYSTKIE ZADANIA DLA INSTANCJI -----
app.get('/api/:slug/tasks', authenticateToken, async (req, res) => {
    const { slug } = req.params;

    try {
        const result = await pool.query(`
            SELECT
                t.id,
                t.text,
                t.status,
                t.created_by_name,
                t.created_at,
                t.owner_name,
                t.taken_at,
                t.completed_at,
                t.edited_by_name,
                t.edited_at
            FROM tasks t
                     JOIN instances i ON t.instance_id = i.id
            WHERE i.slug = $1
            ORDER BY t.created_at DESC
        `, [slug]);

        res.json(result.rows);
    } catch (error) {
        console.error('Błąd podczas pobierania zadań:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// ----- DODAJ NOWE ZADANIE -----
app.post('/api/:slug/tasks', authenticateToken, async (req, res) => {
    const { slug } = req.params;
    const { text } = req.body;
    const { userId, username } = req.user;

    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Treść zadania jest wymagana' });
    }

    try {
        const instanceResult = await pool.query(
            'SELECT id FROM instances WHERE slug = $1',
            [slug]
        );

        if (instanceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Instancja nie istnieje' });
        }

        const instanceId = instanceResult.rows[0].id;

        const result = await pool.query(`
            INSERT INTO tasks (instance_id, text, status, created_by_id, created_by_name)
            VALUES ($1, $2, $3, $4, $5)
                RETURNING *
        `, [instanceId, text, 'available', userId, username]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Błąd podczas dodawania zadania:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// ----- WEŹ ZADANIE -----
app.patch('/api/:slug/tasks/:taskId/take', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    const { userId, username } = req.user;

    try {
        const result = await pool.query(`
            UPDATE tasks
            SET status = 'taken',
                owner_id = $1,
                owner_name = $2,
                taken_at = CURRENT_TIMESTAMP
            WHERE id = $3 AND status = 'available'
                RETURNING *
        `, [userId, username, taskId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Zadanie nie istnieje lub jest już wzięte' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Błąd podczas brania zadania:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// ----- UKOŃCZ ZADANIE -----
app.patch('/api/:slug/tasks/:taskId/complete', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    const { userId } = req.user;

    try {
        const result = await pool.query(`
            UPDATE tasks
            SET status = 'completed',
                completed_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND owner_id = $2 AND status = 'taken'
                RETURNING *
        `, [taskId, userId]);

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Nie masz uprawnień do ukończenia tego zadania' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Błąd podczas kończenia zadania:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// ----- ODDAJ ZADANIE -----
app.patch('/api/:slug/tasks/:taskId/return', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    const { userId } = req.user;

    try {
        const result = await pool.query(`
            UPDATE tasks
            SET status = 'available',
                owner_id = NULL,
                owner_name = NULL,
                taken_at = NULL
            WHERE id = $1 AND owner_id = $2 AND status = 'taken'
                RETURNING *
        `, [taskId, userId]);

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Nie masz uprawnień do oddania tego zadania' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Błąd podczas oddawania zadania:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// ----- EDYTUJ ZADANIE -----
app.patch('/api/:slug/tasks/:taskId', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    const { text } = req.body;
    const { userId, username, role } = req.user;

    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Treść zadania jest wymagana' });
    }

    try {
        // Sprawdź uprawnienia: admin lub twórca zadania
        const checkResult = await pool.query(
            'SELECT created_by_id FROM tasks WHERE id = $1',
            [taskId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Zadanie nie istnieje' });
        }

        if (role !== 'admin' && checkResult.rows[0].created_by_id !== userId) {
            return res.status(403).json({ error: 'Nie masz uprawnień do edycji tego zadania' });
        }

        const result = await pool.query(`
            UPDATE tasks
            SET text = $1,
                edited_by_id = $2,
                edited_by_name = $3,
                edited_at = CURRENT_TIMESTAMP
            WHERE id = $4
                RETURNING *
        `, [text, userId, username, taskId]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Błąd podczas edycji zadania:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// ----- USUŃ ZADANIE (TYLKO ADMIN) -----
app.delete('/api/:slug/tasks/:taskId', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    const { role } = req.user;

    if (role !== 'admin') {
        return res.status(403).json({ error: 'Tylko admin może usuwać zadania' });
    }

    try {
        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING id',
            [taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Zadanie nie istnieje' });
        }

        res.json({ message: 'Zadanie usunięte pomyślnie' });
    } catch (error) {
        console.error('Błąd podczas usuwania zadania:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// ----- SPRAWDŹ CZY INSTANCJA ISTNIEJE -----
app.get('/api/check-instance/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        const result = await pool.query(
            'SELECT slug, company_name FROM instances WHERE slug = $1',
            [slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ exists: false });
        }

        res.json({ exists: true, company: result.rows[0] });
    } catch (error) {
        console.error('Błąd podczas sprawdzania instancji:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// =====================================================
// START SERWERA
// =====================================================

app.listen(PORT, () => {
    console.log(`🚀 Serwer działa na porcie ${PORT}`);
    console.log(`📍 Dostępny w sieci Docker pod adresem http://backend:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM otrzymany, zamykanie...');
    pool.end(() => {
        console.log('Pool bazy danych zamknięty');
        process.exit(0);
    });
});