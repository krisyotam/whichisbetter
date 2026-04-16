'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Item, Comparison } from '@/lib/bradley-terry';
import {
  selectPair,
  updateRatings,
  getRankings,
  MAX_DECISION_TIME_MS,
} from '@/lib/bradley-terry';
import { saveItem, addComparison } from '@/lib/db';
import RankingsTable from './RankingsTable';

interface Props {
  items: Item[];
  setItems: (items: Item[]) => void;
  onReset: () => void;
  displayFields: string[];
}

export default function ComparisonView({ items, setItems, onReset, displayFields }: Props) {
  const [pair, setPair] = useState<[Item, Item] | null>(null);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [totalComparisons, setTotalComparisons] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);

  const pickPair = useCallback(() => {
    if (items.length < 2) return;
    const p = selectPair(items);
    setPair(p);
    setPaused(false);
    pausedRef.current = false;
    setElapsed(0);
    startRef.current = Date.now();
  }, [items]);

  useEffect(() => {
    if (items.length >= 2 && !pair) {
      pickPair();
    }
  }, [items, pair, pickPair]);

  // Timer tick + auto-skip on expiry
  useEffect(() => {
    if (paused || !pair) return;

    const tick = () => {
      const now = Date.now();
      const el = now - startRef.current;
      setElapsed(el);
      if (el >= MAX_DECISION_TIME_MS) {
        // Time expired — skip, no rating update
        setSkipped((s) => s + 1);
        setPair(null);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paused, pair]);

  const handlePause = () => {
    if (paused) {
      // Unpausing = skip this pair (uncommitted)
      setSkipped((s) => s + 1);
      setPair(null);
    } else {
      setPaused(true);
      pausedRef.current = true;
    }
  };

  const handleChoice = async (winner: Item, loser: Item) => {
    if (paused) return;
    const totalElapsed = Date.now() - startRef.current;
    const weight = 1; // Full weight — no degradation, skip instead
    const { winnerRating, loserRating } = updateRatings(winner, loser, weight);

    const updatedWinner = {
      ...winner,
      rating: winnerRating,
      comparisons: winner.comparisons + 1,
      wins: winner.wins + 1,
    };
    const updatedLoser = {
      ...loser,
      rating: loserRating,
      comparisons: loser.comparisons + 1,
    };

    const comparison: Comparison = {
      id: `cmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      winnerId: winner.id,
      loserId: loser.id,
      weight,
      elapsedMs: totalElapsed,
      timestamp: Date.now(),
    };

    await Promise.all([
      saveItem(updatedWinner),
      saveItem(updatedLoser),
      addComparison(comparison),
    ]);

    const updatedItems = items.map((item) => {
      if (item.id === winner.id) return updatedWinner;
      if (item.id === loser.id) return updatedLoser;
      return item;
    });

    setItems(updatedItems);
    setTotalComparisons((c) => c + 1);
    setPair(null);
  };

  if (!pair) return null;

  const [left, right] = pair;
  const timerPct = Math.max(0, Math.min(100, (1 - elapsed / MAX_DECISION_TIME_MS) * 100));
  const secondsLeft = Math.max(0, (MAX_DECISION_TIME_MS - elapsed) / 1000).toFixed(1);

  const renderPanel = (item: Item, chooseItem: () => void) => (
    <div className="image-panel" onClick={paused ? undefined : chooseItem}>
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt={item.name} title={`Choose: ${item.name}`} />
      ) : (
        <div className="image-placeholder" title={item.name} />
      )}
      {displayFields.length > 0 && (
        <div className="item-meta">
          {displayFields.map((field) => {
            const val = item.meta[field];
            if (val === undefined || val === null || val === '') return null;
            return (
              <div key={field} className="meta-row">
                <span className="meta-label">{field}:</span>{' '}
                <span className="meta-value">{String(val)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="content-container">
        {renderPanel(left, () => handleChoice(left, right))}
        {renderPanel(right, () => handleChoice(right, left))}
      </div>

      <div className="timer-container">
        <div className="timer-bar" style={{ width: `${timerPct}%` }} />
      </div>
      <div className="weight-display">
        {paused ? 'PAUSED — unpause to skip' : `${secondsLeft}s`}
        {' | '}rated: {totalComparisons} | skipped: {skipped}
      </div>

      <div className="controls">
        <button
          className="choose-btn"
          disabled={paused}
          onClick={() => handleChoice(left, right)}
        >
          CHOOSE LEFT
        </button>
        <button className="pause-btn" onClick={handlePause}>
          {paused ? 'SKIP (▶)' : 'PAUSE (▮▮)'}
        </button>
        <button
          className="choose-btn"
          disabled={paused}
          onClick={() => handleChoice(right, left)}
        >
          CHOOSE RIGHT
        </button>
      </div>

      <hr className="divider" />

      <RankingsTable items={items} />

      <div className="data-controls">
        <button onClick={onReset}>New Dataset</button>
      </div>
    </>
  );
}
