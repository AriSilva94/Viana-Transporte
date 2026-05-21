# E2E Test Data Cleanup

Past E2E test runs wrote rows into the production Supabase backend before the
safety guard in `src/renderer/test/e2e/fixtures/electron.ts` existed. This
folder contains SQL scripts to identify and remove those rows.

## What gets identified as test data

| Table | Pattern |
|---|---|
| `clients` | name LIKE `__Seed Cliente__ %` or `Cliente Playwright%`, or email LIKE `playwright%@test.com` |
| `projects` | name LIKE `__Seed Projeto__ %` or `Projeto Playwright%` |
| `machines` | name LIKE `__Seed Máquina__ %` or `Máquina Playwright%`, or identifier LIKE `PW-0%` |
| `operators` | name LIKE `__Seed Operador__ %` or `Operador Playwright%` |
| `daily_logs` | work_description LIKE `%Playwright%`, or FK to test project/machine/operator |
| `project_costs` | description LIKE `%Playwright%`, or FK to test project |
| `project_revenues` | description LIKE `%Playwright%`, or FK to test project |

## Procedure

### 1. Dry run (read-only)
1. Open Supabase Studio → SQL Editor.
2. Paste `01-dry-run.sql` and run.
3. Review:
   - Row counts per bucket
   - Sample rows in each table
   - Counts of FK-linked children
4. If any count looks wrong (e.g. a `Cliente Playwright` row actually belongs
   to the customer), stop and adjust patterns before deleting.

### 2. Delete (destructive, transactional)
1. Paste `02-delete.sql` into Supabase Studio.
2. Run as-is — the script wraps everything in `BEGIN ... ROLLBACK`.
3. Inspect the returned counts: `deleted_revenues`, `deleted_costs`,
   `deleted_daily_logs`, `deleted_projects`, `deleted_machines`,
   `deleted_operators`, `deleted_clients`.
4. If counts match expectations, change the last `ROLLBACK;` to `COMMIT;`
   and run again.

## After cleanup
Verify by re-running `01-dry-run.sql`. All counts should be `0`. If any rows
remain, inspect them manually — they may be legitimate customer data that
happens to contain the word "Playwright", or they may need additional
cleanup queries.

## Re-running E2E in the future
The fixture now refuses to run unless `E2E_ACKNOWLEDGE_BACKEND_ISOLATED=YES`
is set AND the built bundle does not contain the production Supabase host.
See `src/renderer/test/e2e/fixtures/electron.ts` for the full guard logic.
