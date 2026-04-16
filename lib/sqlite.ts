import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

let sqlPromise: Promise<SqlJsStatic> | null = null;

function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: () => '/sql-wasm.wasm',
    });
  }
  return sqlPromise;
}

export async function openSqliteFile(buffer: ArrayBuffer): Promise<Database> {
  const SQL = await getSql();
  return new SQL.Database(new Uint8Array(buffer));
}

export function getTableNames(db: Database): string[] {
  const result = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  if (!result.length) return [];
  return result[0].values.map((row) => String(row[0]));
}

export function getTableColumns(db: Database, table: string): string[] {
  const result = db.exec(`PRAGMA table_info("${table}")`);
  if (!result.length) return [];
  return result[0].values.map((row) => String(row[1]));
}

export function queryTable(
  db: Database,
  table: string
): Record<string, unknown>[] {
  const result = db.exec(`SELECT * FROM "${table}"`);
  if (!result.length) return [];
  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

export async function exportDbWithRatings(
  originalBuffer: ArrayBuffer,
  table: string,
  ratings: Map<string, number>, // id -> rating
  idColumn: string
): Promise<Uint8Array> {
  const SQL = await getSql();
  const db = new SQL.Database(new Uint8Array(originalBuffer));

  // Add paired_rating column if it doesn't exist
  const cols = getTableColumns(db, table);
  if (!cols.includes('paired_rating')) {
    db.run(`ALTER TABLE "${table}" ADD COLUMN paired_rating REAL`);
  }

  // Update each row with its rating
  const stmt = db.prepare(`UPDATE "${table}" SET paired_rating = ? WHERE "${idColumn}" = ?`);
  for (const [id, rating] of ratings) {
    stmt.run([rating, id]);
  }
  stmt.free();

  const data = db.export();
  db.close();
  return data;
}
