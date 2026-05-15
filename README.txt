WHICH IS BETTER?

Local paired-comparison ranking tool built on the Bradley-Terry
model. Upload a dataset of images (JSON or SQLite), rate them by
choosing between random pairs, and watch rankings converge in real
time. Everything runs in your browser.

Live site:  https://whichisbetter.dev
Write-up:   https://krisyotam.com/which-is-better


HOW IT WORKS

Two items shown side by side. Pick the one you prefer. The
Bradley-Terry model updates both items' strength parameters using
a maximum-likelihood gradient step. Pairs are selected with an
exploration bias toward items with fewer comparisons, so rankings
stabilize efficiently.

A 15-second timer runs on each pair. If it expires or you pause
and unpause, the pair is skipped with no score change. Only
committed choices affect ratings.


FEATURES

  JSON and SQLite input     Upload .json arrays or .db/.sqlite files.
                            For databases, pick a table and metadata fields.
  Metadata display          Arbitrary fields (description, date, tags, etc.)
                            shown alongside images during comparison.
  No-image support          Items without imageUrl render as blank panels.
  Local storage             Ratings persist in IndexedDB. Export/import JSON.
  Database re-export        Export original SQLite with paired_rating column added.
  Light and dark mode       Toggle in top-right corner.
  Paginated rankings        Live table with rating, win/loss, thumbnail.


DATASET FORMAT

JSON: array of objects. Only "name" is required. "imageUrl" optional.
Any extra keys become selectable metadata fields.

SQLite: any .db, .sqlite, or .sqlite3 file. Choose the table,
then display fields.


THE MODEL

The Bradley-Terry model assigns strength beta_i to each item.
Probability of i beating j:

    P(i > j) = exp(beta_i) / (exp(beta_i) + exp(beta_j))

After i beats j, gradient ascent on log-likelihood:

    beta_i <- beta_i + eta * (1 - P(i > j))
    beta_j <- beta_j - eta * P(i > j)

Learning rate eta = 0.4. Items start at beta = 0.


STACK

  Next.js 16 (App Router, Turbopack)
  sql.js (client-side SQLite)
  idb (IndexedDB)
  No backend.


RUNNING LOCALLY

  git clone https://git.sr.ht/~krisyotam/whichisbetter.dev
  cd whichisbetter.dev
  npm install
  npm run dev

Open localhost:3000.


LICENSE

MIT
