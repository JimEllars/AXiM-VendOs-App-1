-- Cloudflare D1 Schema for AXiM VendOS

-- Custom AXiM Asset ID format example: MACH-001, MACH-002, etc.

CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    stock INTEGER NOT NULL DEFAULT 100,
    temp REAL NOT NULL DEFAULT 38.0,
    last_dex TEXT,
    location TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'FINANCED',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventory_logs (
    id TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL,
    selection_id TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL UNIQUE, -- e.g., NayaxTransactionId
    machine_id TEXT NOT NULL,
    amount REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_approved BOOLEAN NOT NULL DEFAULT 1,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_machine_id ON inventory_logs(machine_id);
CREATE INDEX IF NOT EXISTS idx_transactions_machine_id ON transactions(machine_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
