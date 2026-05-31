-- =====================================================================
-- E2E TEST DATA — DRY RUN (READ-ONLY)
-- =====================================================================
-- Purpose: identify rows injected into the production Supabase database
-- by past E2E test runs (before the safety guard was added).
--
-- This script ONLY reads. It does NOT modify any data.
--
-- How to use:
--   1. Open Supabase Studio → SQL Editor.
--   2. Paste this entire file and run.
--   3. Review the row counts and the sample rows returned by each query.
--   4. If counts look reasonable, proceed to 02-delete.sql.
--
-- LIKE underscore-escape note:
--   "_" is a single-char wildcard in SQL LIKE. We use ESCAPE '|' so that
--   "|_|_Seed" matches the literal string "__Seed". The bar is arbitrary.
-- =====================================================================


-- ───────────────────────────── COUNTS ─────────────────────────────────

SELECT 'clients_seed'        AS bucket, COUNT(*) AS n FROM clients WHERE name LIKE '|_|_Seed Cliente|_|_ %' ESCAPE '|'
UNION ALL
SELECT 'clients_playwright'  AS bucket, COUNT(*) AS n FROM clients WHERE name LIKE 'Cliente Playwright%'
UNION ALL
SELECT 'clients_email'       AS bucket, COUNT(*) AS n FROM clients WHERE email LIKE 'playwright%@test.com'
UNION ALL
SELECT 'projects_seed'       AS bucket, COUNT(*) AS n FROM projects WHERE name LIKE '|_|_Seed Projeto|_|_ %' ESCAPE '|'
UNION ALL
SELECT 'projects_playwright' AS bucket, COUNT(*) AS n FROM projects WHERE name LIKE 'Projeto Playwright%'
UNION ALL
SELECT 'machines_seed'       AS bucket, COUNT(*) AS n FROM machines WHERE name LIKE '|_|_Seed Máquina|_|_ %' ESCAPE '|'
UNION ALL
SELECT 'machines_playwright' AS bucket, COUNT(*) AS n FROM machines WHERE name LIKE 'Máquina Playwright%'
UNION ALL
SELECT 'machines_pw_id'      AS bucket, COUNT(*) AS n FROM machines WHERE identifier LIKE 'PW-0%'
UNION ALL
SELECT 'operators_seed'      AS bucket, COUNT(*) AS n FROM operators WHERE name LIKE '|_|_Seed Operador|_|_ %' ESCAPE '|'
UNION ALL
SELECT 'operators_playwright' AS bucket, COUNT(*) AS n FROM operators WHERE name LIKE 'Operador Playwright%'
UNION ALL
SELECT 'daily_logs_playwright' AS bucket, COUNT(*) AS n FROM daily_logs WHERE work_description LIKE '%Playwright%'
UNION ALL
SELECT 'project_costs_playwright' AS bucket, COUNT(*) AS n FROM project_costs WHERE description LIKE '%Playwright%'
UNION ALL
SELECT 'project_revenues_playwright' AS bucket, COUNT(*) AS n FROM project_revenues WHERE description LIKE '%Playwright%';


-- ─────────────────────────── SAMPLE ROWS ──────────────────────────────
-- Run each block separately to inspect what would be deleted.

-- Clients
SELECT id, name, email, created_at
FROM clients
WHERE name LIKE '|_|_Seed Cliente|_|_ %' ESCAPE '|'
   OR name LIKE 'Cliente Playwright%'
   OR email LIKE 'playwright%@test.com'
ORDER BY created_at DESC;

-- Projects
SELECT id, client_id, name, status, created_at
FROM projects
WHERE name LIKE '|_|_Seed Projeto|_|_ %' ESCAPE '|'
   OR name LIKE 'Projeto Playwright%'
ORDER BY created_at DESC;

-- Machines
SELECT id, name, identifier, type, created_at
FROM machines
WHERE name LIKE '|_|_Seed Máquina|_|_ %' ESCAPE '|'
   OR name LIKE 'Máquina Playwright%'
   OR identifier LIKE 'PW-0%'
ORDER BY created_at DESC;

-- Operators
SELECT id, name, role, created_at
FROM operators
WHERE name LIKE '|_|_Seed Operador|_|_ %' ESCAPE '|'
   OR name LIKE 'Operador Playwright%'
ORDER BY created_at DESC;

-- Daily logs (anything mentioning Playwright in description)
SELECT id, project_id, machine_id, operator_id, work_description, created_at
FROM daily_logs
WHERE work_description LIKE '%Playwright%'
ORDER BY created_at DESC;

-- Costs
SELECT id, project_id, description, amount, created_at
FROM project_costs
WHERE description LIKE '%Playwright%'
ORDER BY created_at DESC;

-- Revenues
SELECT id, project_id, description, amount, created_at
FROM project_revenues
WHERE description LIKE '%Playwright%'
ORDER BY created_at DESC;


-- ───────────── CHILD ROWS LINKED TO TEST PROJECTS/MACHINES/OPERATORS ──────────
-- These rows might NOT match the Playwright/__Seed name patterns directly
-- (e.g. daily_logs created from a seeded project but with a non-test description),
-- but they reference test parent rows via foreign key.
-- Inspect carefully — if a row's parent is a test row, the child is also test data.

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
)
SELECT
  'daily_logs_via_fk'      AS bucket,
  COUNT(*)                 AS n
FROM daily_logs
WHERE project_id  IN (SELECT id FROM test_projects)
   OR machine_id  IN (SELECT id FROM test_machines)
   OR operator_id IN (SELECT id FROM test_operators)
UNION ALL
SELECT
  'project_costs_via_fk'   AS bucket,
  COUNT(*)                 AS n
FROM project_costs
WHERE project_id  IN (SELECT id FROM test_projects)
UNION ALL
SELECT
  'project_revenues_via_fk' AS bucket,
  COUNT(*)                  AS n
FROM project_revenues
WHERE project_id  IN (SELECT id FROM test_projects);
