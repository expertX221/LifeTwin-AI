CREATE TABLE IF NOT EXISTS lifetwin_health_sync (
  token_hash text PRIMARY KEY,
  iv text NOT NULL,
  ciphertext text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
