'use client';

import { useRef, useState } from 'react';
import type { Item } from '@/lib/bradley-terry';
import type { Database } from 'sql.js';
import type { queryTable as QueryTableFn } from '@/lib/sqlite';
import { saveMeta } from '@/lib/db';

interface Props {
  onLoad: (items: Item[], displayFields: string[]) => void;
}

// 25 AI anime faces from TWDNE — the early StyleGAN aesthetic
const SAMPLE_DATASET = [
  { name: 'Waifu #10001', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10001.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10002', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10002.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10003', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10003.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10004', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10004.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10005', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10005.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10006', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10006.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10007', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10007.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10008', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10008.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10009', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10009.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10010', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10010.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10011', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10011.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10012', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10012.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10013', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10013.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10014', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10014.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10015', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10015.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10016', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10016.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10017', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10017.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10018', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10018.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10019', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10019.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10020', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10020.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10021', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10021.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10022', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10022.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10023', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10023.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10024', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10024.jpg', model: 'StyleGAN 2', epoch: 'early' },
  { name: 'Waifu #10025', imageUrl: 'https://www.thiswaifudoesnotexist.net/example-10025.jpg', model: 'StyleGAN 2', epoch: 'early' },
];

const RESERVED_KEYS = new Set(['id', 'ID', 'Id', 'rowid', 'ROWID', '_id']);
const IMAGE_FIELD_HINTS = ['imageUrl', 'imageurl', 'image_url', 'img', 'src', 'cover', 'thumbnail', 'photo', 'picture', 'avatar', 'image'];
const NONE_IMAGE = '__none__';

function detectIdColumn(rows: Record<string, unknown>[]): string {
  if (!rows.length) return 'id';
  const keys = Object.keys(rows[0]);
  for (const candidate of ['id', 'ID', 'Id', 'rowid', 'ROWID', '_id']) {
    if (keys.includes(candidate)) return candidate;
  }
  return keys[0];
}

function getAllKeys(rows: Record<string, unknown>[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      keys.add(key);
    }
  }
  return [...keys].sort();
}

function guessImageField(keys: string[]): string {
  for (const hint of IMAGE_FIELD_HINTS) {
    const match = keys.find((k) => k.toLowerCase() === hint.toLowerCase());
    if (match) return match;
  }
  return NONE_IMAGE;
}

function guessNameField(keys: string[]): string {
  for (const hint of ['name', 'title', 'label', 'Name', 'Title']) {
    if (keys.includes(hint)) return hint;
  }
  return '';
}

function buildItems(
  raw: Record<string, unknown>[],
  imageField: string | null,
  displayFields: string[]
): Item[] {
  const nameField = guessNameField(Object.keys(raw[0] || {}));
  return raw.map((e, i) => {
    const meta: Record<string, string | number | boolean> = {};
    for (const key of displayFields) {
      const val = e[key];
      if (val !== undefined && val !== null && (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean')) {
        meta[key] = val;
      }
    }

    const idVal = e.id ?? e.ID ?? e.Id ?? e.rowid ?? e.ROWID ?? e._id;

    return {
      id: idVal != null ? String(idVal) : `item-${i}-${Date.now()}`,
      name: nameField ? String(e[nameField] ?? `Item ${i + 1}`) : `Item ${i + 1}`,
      imageUrl: imageField && imageField !== NONE_IMAGE ? (String(e[imageField] ?? '') || undefined) : undefined,
      rating: 0,
      comparisons: 0,
      wins: 0,
      meta,
    };
  });
}

type Step =
  | { type: 'upload' }
  | { type: 'table'; db: Database; tables: string[]; rowCounts: Record<string, number>; buffer: ArrayBuffer }
  | { type: 'fields'; raw: Record<string, unknown>[]; allKeys: string[] };

export default function UploadBox({ onLoad }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>({ type: 'upload' });
  const [imageField, setImageField] = useState<string>(NONE_IMAGE);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const queryTableRef = useRef<typeof QueryTableFn | null>(null);

  const processEntries = (raw: Record<string, unknown>[]) => {
    if (raw.length < 2) {
      alert('Dataset must contain at least 2 items.');
      return;
    }
    const allKeys = getAllKeys(raw);
    const nonReserved = allKeys.filter((k) => !RESERVED_KEYS.has(k));

    if (nonReserved.length === 0) {
      // No fields at all beyond id — just load directly
      const items = buildItems(raw, null, []);
      onLoad(items, []);
      return;
    }

    const guessedImg = guessImageField(nonReserved);
    setImageField(guessedImg);
    setSelectedFields(new Set());
    setStep({ type: 'fields', raw, allKeys: nonReserved });
  };

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'db' || ext === 'sqlite' || ext === 'sqlite3') {
      const { openSqliteFile, getTableNames, queryTable } = await import('@/lib/sqlite');
      queryTableRef.current = queryTable;
      const buffer = await file.arrayBuffer();
      const resolvedDb = await openSqliteFile(buffer);
      const tables = getTableNames(resolvedDb);

      if (tables.length === 0) {
        alert('No tables found in database.');
        return;
      }

      const rowCounts: Record<string, number> = {};
      for (const table of tables) {
        rowCounts[table] = queryTable(resolvedDb, table).length;
      }

      if (tables.length === 1) {
        const rows = queryTable(resolvedDb, tables[0]);
        resolvedDb.close();
        await saveMeta('sqlite-buffer', new Uint8Array(buffer));
        await saveMeta('sqlite-table', tables[0]);
        const idCol = detectIdColumn(rows);
        await saveMeta('sqlite-id-column', idCol);
        processEntries(rows);
      } else {
        setStep({ type: 'table', db: resolvedDb, tables, rowCounts, buffer });
      }
      return;
    }

    // JSON
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      const entries: Record<string, unknown>[] = Array.isArray(parsed)
        ? parsed
        : parsed.items || [];
      processEntries(entries);
    } catch {
      alert('Invalid JSON file.');
    }
  };

  const handleSelectTable = async (table: string) => {
    if (step.type !== 'table') return;
    let qt = queryTableRef.current;
    if (!qt) {
      const mod = await import('@/lib/sqlite');
      qt = mod.queryTable;
    }
    const rows = qt(step.db, table);
    step.db.close();
    await saveMeta('sqlite-buffer', new Uint8Array(step.buffer));
    await saveMeta('sqlite-table', table);
    const idCol = detectIdColumn(rows);
    await saveMeta('sqlite-id-column', idCol);
    processEntries(rows);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const loadSample = () => {
    processEntries(SAMPLE_DATASET as unknown as Record<string, unknown>[]);
  };

  const downloadSample = () => {
    const blob = new Blob([JSON.stringify(SAMPLE_DATASET, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-dataset.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmFields = () => {
    if (step.type !== 'fields') return;
    const imgField = imageField !== NONE_IMAGE ? imageField : null;
    const display = [...selectedFields].filter((k) => k !== imageField);
    const items = buildItems(step.raw, imgField, display);
    onLoad(items, display);
    setStep({ type: 'upload' });
  };

  const toggleField = (key: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Non-image, non-name fields available for display checkboxes
  const displayableKeys = step.type === 'fields'
    ? step.allKeys.filter((k) => k !== imageField && !guessNameField(step.allKeys).includes(k))
    : [];

  // Step: Table selection (SQLite)
  if (step.type === 'table') {
    return (
      <div className="upload-screen">
        <div className="field-selector">
          <h3>Select a table</h3>
          <p className="field-hint">
            This database has {step.tables.length} tables. Pick one to load as your dataset.
          </p>
          <div className="field-list">
            {step.tables.map((table) => (
              <button
                key={table}
                className="table-option"
                onClick={() => handleSelectTable(table)}
              >
                <span className="table-name">{table}</span>
                <span className="table-count">{step.rowCounts[table]} rows</span>
              </button>
            ))}
          </div>
          <div className="field-actions">
            <button onClick={() => { step.db.close(); setStep({ type: 'upload' }); }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // Step: Field selection (image field + display fields)
  if (step.type === 'fields') {
    const sampleRow = step.raw[0] || {};
    return (
      <div className="upload-screen">
        <div className="field-selector">
          <h3>Configure fields</h3>

          <div className="field-section">
            <p className="field-section-label">Image field (one only)</p>
            <div className="field-list">
              <label className="field-option">
                <input
                  type="radio"
                  name="image-field"
                  checked={imageField === NONE_IMAGE}
                  onChange={() => setImageField(NONE_IMAGE)}
                />
                <span className="meta-label">None</span>
                <span className="field-sample">no images</span>
              </label>
              {step.allKeys.map((key) => (
                <label key={key} className="field-option">
                  <input
                    type="radio"
                    name="image-field"
                    checked={imageField === key}
                    onChange={() => {
                      setImageField(key);
                      // Remove from display fields if it was checked
                      setSelectedFields((prev) => {
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                      });
                    }}
                  />
                  <span>{key}</span>
                  <span className="field-sample">
                    {String(sampleRow[key] ?? '').slice(0, 50)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {displayableKeys.length > 0 && (
            <div className="field-section">
              <p className="field-section-label">Display fields (shown during comparison)</p>
              <div className="field-list">
                {displayableKeys.map((key) => (
                  <label key={key} className="field-option">
                    <input
                      type="checkbox"
                      checked={selectedFields.has(key)}
                      onChange={() => toggleField(key)}
                    />
                    <span>{key}</span>
                    <span className="field-sample">
                      e.g. {String(sampleRow[key] ?? '—').slice(0, 50)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="field-actions">
            <button onClick={confirmFields}>
              Start Rating ({step.raw.length} items)
            </button>
            <button onClick={() => setStep({ type: 'upload' })}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // Step: Upload
  return (
    <div className="upload-screen">
      <div
        className="upload-box"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <p className="upload-label">Upload Dataset</p>
        <p className="upload-hint">
          Drop a .json or .db / .sqlite file here, or click to browse.
          <br />
          JSON: array of {`{ "name": "...", "imageUrl": "...", ... }`}
          <br />
          SQLite: pick a table, then choose display fields.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".json,.db,.sqlite,.sqlite3"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      <div className="sample-link">
        <button onClick={loadSample}>Load sample dataset (25 AI anime faces)</button>
        {' | '}
        <button onClick={downloadSample}>Download sample JSON</button>
      </div>
    </div>
  );
}
