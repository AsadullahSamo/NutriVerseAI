CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL,
  "sess" jsonb NOT NULL,
  "expire" timestamptz NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");