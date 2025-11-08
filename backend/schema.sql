-- =====================================================
-- TASKLISTER - POSTGRESQL DATABASE SCHEMA
-- =====================================================

-- Tabela instancji (firm/organizacji)
CREATE TABLE instances (
                           id SERIAL PRIMARY KEY,
                           slug VARCHAR(100) UNIQUE NOT NULL,  -- np. "abc" z URL tasklister.pl/abc
                           company_name VARCHAR(255) NOT NULL,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indeks dla szybkiego wyszukiwania po slug
CREATE INDEX idx_instances_slug ON instances(slug);

-- Tabela użytkowników
CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       instance_id INTEGER NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
                       username VARCHAR(100) NOT NULL,
                       password_hash VARCHAR(255),  -- NULL dla zwykłych użytkowników, wypełnione dla admina
                       role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       last_login TIMESTAMP,
                       UNIQUE(instance_id, username)  -- Unikalna nazwa w obrębie instancji
);

-- Indeksy dla users
CREATE INDEX idx_users_instance ON users(instance_id);
CREATE INDEX idx_users_username ON users(instance_id, username);

-- Tabela zadań
CREATE TABLE tasks (
                       id SERIAL PRIMARY KEY,
                       instance_id INTEGER NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
                       text TEXT NOT NULL,
                       status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'taken', 'completed')),

    -- Informacje o tworzeniu
                       created_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                       created_by_name VARCHAR(100) NOT NULL,  -- Denormalizacja dla wydajności
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Informacje o przypisaniu
                       owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                       owner_name VARCHAR(100),
                       taken_at TIMESTAMP,

    -- Informacje o ukończeniu
                       completed_at TIMESTAMP,

    -- Informacje o edycji
                       edited_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                       edited_by_name VARCHAR(100),
                       edited_at TIMESTAMP,

                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indeksy dla tasks
CREATE INDEX idx_tasks_instance ON tasks(instance_id);
CREATE INDEX idx_tasks_status ON tasks(instance_id, status);
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- Trigger do aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNKCJE POMOCNICZE
-- =====================================================

-- Funkcja do generowania bezpiecznego slug z nazwy firmy
CREATE OR REPLACE FUNCTION generate_slug(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Konwersja na lowercase, zamiana spacji i znaków specjalnych na myślniki
    base_slug := LOWER(TRIM(REGEXP_REPLACE(company_name, '[^a-zA-Z0-9]+', '-', 'g')));
    base_slug := TRIM(BOTH '-' FROM base_slug);

    -- Jeśli pusty, użyj domyślnego
    IF base_slug = '' THEN
        base_slug := 'instance';
END IF;

    -- Sprawdź unikalność i dodaj licznik jeśli potrzeba
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM instances WHERE slug = final_slug) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
END LOOP;

RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ZAPYTANIA DO STATYSTYK
-- =====================================================

-- Statystyki dla instancji
CREATE OR REPLACE VIEW instance_stats AS
SELECT
    i.id as instance_id,
    i.slug,
    i.company_name,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'available' THEN t.id END) as available_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'taken' THEN t.id END) as taken_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks
FROM instances i
         LEFT JOIN users u ON u.instance_id = i.id
         LEFT JOIN tasks t ON t.instance_id = i.id
GROUP BY i.id, i.slug, i.company_name;

-- =====================================================
-- POLITYKI BEZPIECZEŃSTWA (opcjonalne - dla RLS)
-- =====================================================

-- Włączenie Row Level Security (opcjonalne)
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Przykładowe polityki RLS
-- CREATE POLICY tasks_instance_isolation ON tasks
--     USING (instance_id = current_setting('app.current_instance_id')::INTEGER);

-- =====================================================
-- PROCEDURY DO CZYSZCZENIA STARYCH DANYCH
-- =====================================================

-- Usuwanie ukończonych zadań starszych niż 90 dni
CREATE OR REPLACE FUNCTION cleanup_old_completed_tasks()
RETURNS INTEGER AS $$
DECLARE
deleted_count INTEGER;
BEGIN
DELETE FROM tasks
WHERE status = 'completed'
  AND completed_at < CURRENT_TIMESTAMP - INTERVAL '90 days';

GET DIAGNOSTICS deleted_count = ROW_COUNT;
RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Harmonogram czyszczenia (wymaga rozszerzenia pg_cron)
-- SELECT cron.schedule('cleanup-old-tasks', '0 2 * * 0', 'SELECT cleanup_old_completed_tasks()');

-- =====================================================
-- INFORMACJE O WERSJACH I MIGRACJACH
-- =====================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
                                                 version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
    );

INSERT INTO schema_migrations (version, description) VALUES
    ('1.0.0', 'Initial schema with instances, users, and tasks');

-- =====================================================
-- ZAKOŃCZENIE
-- =====================================================

-- Sprawdzenie utworzonych tabel
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;