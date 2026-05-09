#!/bin/bash
set -e

pnpm install

pnpm --filter @workspace/db run push-force

# Backfill immutable IDs on orders for rows created before the customerId/vendorId
# columns were added. Rows where the display name uniquely resolves to one user are
# updated; rows with duplicate/ambiguous names remain NULL and are quarantined by
# the strict ID-based authorization checks in orders.ts.
psql "$DATABASE_URL" <<'SQL'
UPDATE orders o
SET customer_id = u.id
FROM users u
WHERE o.customer_id IS NULL
  AND o.customer_name = u.name
  AND u.role = 'musteri'
  AND (SELECT COUNT(*) FROM users WHERE name = o.customer_name AND role = 'musteri') = 1;

UPDATE orders o
SET vendor_id = u.id
FROM users u
WHERE o.vendor_id IS NULL
  AND o.vendor_name = u.name
  AND u.role = 'firma'
  AND (SELECT COUNT(*) FROM users WHERE name = o.vendor_name AND role = 'firma') = 1;

UPDATE reviews r
SET vendor_id = u.id
FROM users u
WHERE r.vendor_id IS NULL
  AND r.vendor_name = u.name
  AND u.role = 'firma'
  AND (SELECT COUNT(*) FROM users WHERE name = r.vendor_name AND role = 'firma') = 1;
SQL
