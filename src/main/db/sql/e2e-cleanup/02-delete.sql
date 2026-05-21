-- =====================================================================
-- E2E TEST DATA — DELETE (DESTRUCTIVE)
-- =====================================================================
-- DO NOT RUN THIS FILE WITHOUT FIRST RUNNING 01-dry-run.sql AND
-- CONFIRMING THE ROW COUNTS AND SAMPLE ROWS LOOK CORRECT.
--
-- This script DELETES rows. It is wrapped in a transaction so you can
-- inspect deleted counts and ROLLBACK if anything looks wrong.
--
-- Order of deletion respects foreign-key dependencies:
--   1. project_revenues  (FK → projects)
--   2. project_costs     (FK → projects, possibly machines/operators)
--   3. daily_logs        (FK → projects, machines, operators)
--   4. projects          (FK → clients)
--   5. machines          (independent)
--   6. operators         (independent)
--   7. clients           (last)
--
-- Run in Supabase Studio → SQL Editor. To commit: change ROLLBACK to COMMIT.
-- =====================================================================

BEGIN;

WITH test_clients AS (
  SELECT id FROM clients
  WHERE name LIKE '|_|_Seed Cliente|_|_ %' ESCAPE '|'
     OR name LIKE 'Cliente Playwright%'
     OR email LIKE 'playwright%@test.com'
),
test_projects AS (
  SELECT id FROM projects
  WHERE name LIKE '|_|_Seed Projeto|_|_ %' ESCAPE '|'
     OR name LIKE 'Projeto Playwright%'
     OR client_id IN (SELECT id FROM test_clients)
),
test_machines AS (
  SELECT id FROM machines
  WHERE name LIKE '|_|_Seed Máquina|_|_ %' ESCAPE '|'
     OR name LIKE 'Máquina Playwright%'
     OR identifier LIKE 'PW-0%'
),
test_operators AS (
  SELECT id FROM operators
  WHERE name LIKE '|_|_Seed Operador|_|_ %' ESCAPE '|'
     OR name LIKE 'Operador Playwright%'
),

-- 1. project_revenues
del_revenues AS (
  DELETE FROM project_revenues
  WHERE project_id IN (SELECT id FROM test_projects)
     OR description LIKE '%Playwright%'
  RETURNING id
),

-- 2. project_costs
del_costs AS (
  DELETE FROM project_costs
  WHERE project_id IN (SELECT id FROM test_projects)
     OR description LIKE '%Playwright%'
  RETURNING id
),

-- 3. daily_logs
del_daily_logs AS (
  DELETE FROM daily_logs
  WHERE project_id  IN (SELECT id FROM test_projects)
     OR machine_id  IN (SELECT id FROM test_machines)
     OR operator_id IN (SELECT id FROM test_operators)
     OR work_description LIKE '%Playwright%'
  RETURNING id
),

-- 4. projects
del_projects AS (
  DELETE FROM projects
  WHERE id IN (SELECT id FROM test_projects)
  RETURNING id
),

-- 5. machines
del_machines AS (
  DELETE FROM machines
  WHERE id IN (SELECT id FROM test_machines)
  RETURNING id
),

-- 6. operators
del_operators AS (
  DELETE FROM operators
  WHERE id IN (SELECT id FROM test_operators)
  RETURNING id
),

-- 7. clients
del_clients AS (
  DELETE FROM clients
  WHERE id IN (SELECT id FROM test_clients)
  RETURNING id
)

SELECT
  (SELECT COUNT(*) FROM del_revenues)   AS deleted_revenues,
  (SELECT COUNT(*) FROM del_costs)      AS deleted_costs,
  (SELECT COUNT(*) FROM del_daily_logs) AS deleted_daily_logs,
  (SELECT COUNT(*) FROM del_projects)   AS deleted_projects,
  (SELECT COUNT(*) FROM del_machines)   AS deleted_machines,
  (SELECT COUNT(*) FROM del_operators)  AS deleted_operators,
  (SELECT COUNT(*) FROM del_clients)    AS deleted_clients;

-- Review counts above. If they match the dry-run, switch the next line to COMMIT.
-- Otherwise leave it as ROLLBACK and investigate.
ROLLBACK;
-- COMMIT;
