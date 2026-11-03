CREATE TABLE portfolio_content (
 id TEXT PRIMARY KEY NOT NULL,
 content TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL
);
CREATE TABLE login_limits (
 bucket TEXT PRIMARY KEY NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0,
 expires_at INTEGER NOT NULL
);
CREATE INDEX login_limits_expiry ON login_limits(expires_at);
