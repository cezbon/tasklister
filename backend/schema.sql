CREATE TABLE instances (
                           id SERIAL PRIMARY KEY,
                           slug VARCHAR(100) UNIQUE NOT NULL,
                           company_name VARCHAR(255) NOT NULL,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_instances_slug ON instances(slug);

CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       instance_id INTEGER NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
                       username VARCHAR(100) NOT NULL,
                       password_hash VARCHAR(255),
                       role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       last_login TIMESTAMP,
                       UNIQUE(instance_id, username)
);

CREATE INDEX idx_users_instance ON users(instance_id);
CREATE INDEX idx_users_username ON users(instance_id, username);

CREATE TABLE tasks (
                       id SERIAL PRIMARY KEY,
                       instance_id INTEGER NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
                       text TEXT NOT NULL,
                       status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'taken', 'completed')),
                       created_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                       created_by_name VARCHAR(100) NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                       owner_name VARCHAR(100),
                       taken_at TIMESTAMP,
                       completed_at TIMESTAMP,
                       edited_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                       edited_by_name VARCHAR(100),
                       edited_at TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_instance ON tasks(instance_id);
CREATE INDEX idx_tasks_status ON tasks(instance_id, status);
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

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

CREATE OR REPLACE FUNCTION generate_slug(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    base_slug := LOWER(TRIM(REGEXP_REPLACE(company_name, '[^a-zA-Z0-9]+', '-', 'g')));
    base_slug := TRIM(BOTH '-' FROM base_slug);

    IF base_slug = '' THEN
        base_slug := 'instance';
END IF;

    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM instances WHERE slug = final_slug) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
END LOOP;

RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

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

CREATE TABLE IF NOT EXISTS schema_migrations (
                                                 version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
    );

INSERT INTO schema_migrations (version, description)
VALUES ('1.0.0', 'Initial schema with instances, users, and tasks');

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
