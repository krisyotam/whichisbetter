'use client';

import { useState } from 'react';
import { getRankings } from '@/lib/bradley-terry';
import { exportData } from '@/lib/db';
import type { Item } from '@/lib/bradley-terry';

interface Props {
  items: Item[];
}

const PAGE_SIZE = 10;

export default function RankingsTable({ items }: Props) {
  const ranked = getRankings(items);
  const totalPages = Math.ceil(ranked.length / PAGE_SIZE);
  const [page, setPage] = useState(0);

  const start = page * PAGE_SIZE;
  const visible = ranked.slice(start, start + PAGE_SIZE);

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kbt-ratings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rankings">
      <h3>Current Rankings</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th></th>
            <th>Name</th>
            <th>Rating</th>
            <th>W/L</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((item, i) => (
            <tr key={item.id}>
              <td>{start + i + 1}</td>
              <td>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="rank-img"
                    src={item.imageUrl}
                    alt={item.name}
                  />
                ) : (
                  <div className="rank-img-placeholder" />
                )}
              </td>
              <td>{item.name}</td>
              <td>{item.rating.toFixed(3)}</td>
              <td>
                {item.wins}/{item.comparisons}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span className="page-info">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      <div className="data-controls" style={{ marginTop: '0.75em' }}>
        <button onClick={handleExport}>Export Ratings (JSON)</button>
      </div>
    </div>
  );
}
