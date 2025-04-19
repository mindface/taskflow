-- migrations/YYYYMMDDHHMMSS_create_tables.sql

CREATE TABLE IF NOT EXISTS app_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_type TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    severity TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add migration script here
CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT,
    last_visit_time INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS browser_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    browser TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    visit_time DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS history_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT,
    visit_time DATETIME NOT NULL
);

-- Safari用訪問履歴テーブル
CREATE TABLE IF NOT EXISTS history_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    history_item INTEGER NOT NULL,
    visit_time REAL NOT NULL,
    FOREIGN KEY (history_item) REFERENCES history_items(id)
);
