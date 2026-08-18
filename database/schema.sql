DROP TABLE IF EXISTS sms_log CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS masters CASCADE;

CREATE TABLE masters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    sms_enabled BOOLEAN DEFAULT true,
    smsru_api_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    short_description VARCHAR(500),
    full_description TEXT,
    purpose TEXT,
    duration_min INT NOT NULL CHECK (duration_min > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(11) UNIQUE NOT NULL CHECK (phone ~ '^\d{11}$'),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'blocked')),
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    UNIQUE(date, start_time)
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    service_id UUID NOT NULL REFERENCES services(id),
    slot_id UUID NOT NULL REFERENCES time_slots(id),
    price_at_moment DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'done', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sms_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('day', 'hour')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP
);

CREATE INDEX idx_slots_date ON time_slots(date);
CREATE INDEX idx_slots_status ON time_slots(status);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_sms_log_appointment ON sms_log(appointment_id, type);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Первый мастер (пароль: admin123, потом поменяешь через хеш)
INSERT INTO masters (login, password_hash, name) 
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Мастер');

INSERT INTO system_settings (key, value) VALUES ('sms_mode', 'platform');
INSERT INTO system_settings (key, value) VALUES ('smsru_platform_api_key', '');

INSERT INTO categories (name, icon, sort_order) VALUES ('Маникюр', '💅', 1);
INSERT INTO categories (name, icon, sort_order) VALUES ('Педикюр', '👣', 2);
INSERT INTO categories (name, icon, sort_order) VALUES ('Брови', '✨', 3);