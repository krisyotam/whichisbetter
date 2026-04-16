'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Item } from '@/lib/bradley-terry';
import { loadItems, clearItems, importData, exportData, loadMeta } from '@/lib/db';
import ThemeToggle from '../components/ThemeToggle';
import ComparisonView from '../components/ComparisonView';

export default function RatePage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [displayFields, setDisplayFields] = useState<string[]>([]);
  const [hasSourceDb, setHasSourceDb] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      loadItems(),
      loadMeta('sqlite-buffer'),
    ]).then(([stored, buf]) => {
      if (stored.length < 2) {
        router.replace('/');
        return;
      }
      setItems(stored);
      setHasSourceDb(!!buf);
      const fields = localStorage.getItem('kbt-display-fields');
      if (fields) {
        try { setDisplayFields(JSON.parse(fields)); } catch { /* ignore */ }
      }
      setLoaded(true);
    });
  }, [router]);

  const handleReset = async () => {
    await clearItems();
    localStorage.removeItem('kbt-display-fields');
    router.push('/');
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        await importData(text);
        const restored = await loadItems();
        setItems(restored);
      } catch {
        alert('Invalid export file.');
      }
    };
    input.click();
  };

  const handleExportJson = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kbt-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDb = async () => {
    const [bufferRaw, table, idCol] = await Promise.all([
      loadMeta('sqlite-buffer'),
      loadMeta('sqlite-table'),
      loadMeta('sqlite-id-column'),
    ]);
    if (!bufferRaw || !table || !idCol) {
      alert('No source database found.');
      return;
    }

    const { exportDbWithRatings } = await import('@/lib/sqlite');
    const currentItems = await loadItems();
    const ratings = new Map<string, number>();
    for (const item of currentItems) {
      ratings.set(item.id, item.rating);
    }

    const uint8 = bufferRaw as Uint8Array;
    const sliced = (uint8.buffer as ArrayBuffer).slice(
      uint8.byteOffset,
      uint8.byteOffset + uint8.byteLength
    );
    const result = await exportDbWithRatings(
      sliced,
      table as string,
      ratings,
      idCol as string
    );

    const blob = new Blob([result as BlobPart], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kbt-rated-${new Date().toISOString().slice(0, 10)}.db`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!loaded) return null;

  return (
    <>
      <header className="site-header">
        <ThemeToggle />
        <h1>
          <a href="/">
            &ldquo;Which Is Better?&rdquo;
          </a>
        </h1>
        <p className="subtitle">
          (Model &amp; site by{' '}
          <a href="https://krisyotam.com/kbt" target="_blank" rel="noopener">
            Kris Yotam
          </a>
          .)
        </p>
      </header>

      <ComparisonView
        items={items}
        setItems={setItems}
        onReset={handleReset}
        displayFields={displayFields}
      />

      <hr className="divider" />

      <div className="data-controls">
        <button onClick={handleExportJson}>Export JSON</button>
        {hasSourceDb && <button onClick={handleExportDb}>Export .db (with ratings)</button>}
        <button onClick={handleImport}>Import Backup</button>
      </div>
    </>
  );
}
