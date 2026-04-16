'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadItems, saveItems, clearItems } from '@/lib/db';
import ThemeToggle from './components/ThemeToggle';
import UploadBox from './components/UploadBox';
import type { Item } from '@/lib/bradley-terry';

export default function Home() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    loadItems().then((stored) => {
      setHasExisting(stored.length >= 2);
      setLoaded(true);
    });
  }, []);

  const handleLoad = async (newItems: Item[], fields: string[]) => {
    await clearItems();
    await saveItems(newItems);
    if (fields.length > 0) {
      localStorage.setItem('kbt-display-fields', JSON.stringify(fields));
    } else {
      localStorage.removeItem('kbt-display-fields');
    }
    router.push('/rate');
  };

  const handleResume = () => {
    router.push('/rate');
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
          <a href="https://krisyotam.com" target="_blank" rel="noopener">
            Kris Yotam
          </a>
          .)
        </p>
      </header>

      <UploadBox onLoad={handleLoad} />

      {hasExisting && (
        <div className="data-controls">
          <button onClick={handleResume}>Resume Previous Session</button>
        </div>
      )}

      <div className="description">
        <hr className="divider" />
        <p>
          Behind this is a local implementation of the{' '}
          <a
            href="https://en.wikipedia.org/wiki/Bradley%E2%80%93Terry_model"
            target="_blank"
            rel="noopener"
          >
            Bradley-Terry model
          </a>
          {' '}for paired comparison ranking. You upload a JSON dataset of images
          (with optional metadata like descriptions, dates, or tags) and rate
          them by choosing between random pairs. Each committed choice updates
          ratings via maximum-likelihood gradient steps. If you pause or let the
          15-second timer expire, the pair is skipped — only deliberate choices
          count. All computation and storage happens locally in your browser via
          IndexedDB; nothing is sent to any server. You can export your rankings
          at any time as JSON, or import a previous session to resume. See the{' '}
          <a
            href="https://krisyotam.com/notebooks/bradley-terry-model"
            target="_blank"
            rel="noopener"
          >
            notebook on the Bradley-Terry model
          </a>
          {' '}for the full mathematical background. Site and model by{' '}
          <a href="https://krisyotam.com" target="_blank" rel="noopener">
            Kris Yotam
          </a>
          . And see also: the source on{' '}
          <a
            href="https://github.com/krisyotam"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </a>
          .
        </p>
        <p className="description-note">
          Related note: datasets can include any extra fields beyond name and imageUrl.
          On load you choose which fields to display alongside images during comparison.
          Items without images appear as blank panels.
        </p>
      </div>
    </>
  );
}
