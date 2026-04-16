# Which Is Better?

A local paired-comparison ranking tool built on the [Bradley-Terry model](https://en.wikipedia.org/wiki/Bradley%E2%80%93Terry_model). Upload a dataset of images (JSON or SQLite), rate them by choosing between random pairs, and watch rankings converge in real time. Everything runs in your browser — no server, no accounts, no tracking.

**Live site**: [whichisbetter.dev](https://whichisbetter.dev)
**Write-up**: [krisyotam.com/which-is-better](https://krisyotam.com/which-is-better)

## How it works

You are shown two items side by side. Pick the one you prefer. The Bradley-Terry model updates both items' strength parameters using a maximum-likelihood gradient step. Pairs are selected with an exploration bias toward items with fewer comparisons, so rankings stabilize efficiently.

A 15-second timer runs on each pair. If it expires or you pause and unpause, the pair is skipped with no score change — only committed choices affect ratings. This keeps the data clean: indecision and distraction don't pollute your rankings.

## Features

- **JSON and SQLite input** — upload `.json` arrays or `.db`/`.sqlite` files. For databases, pick a table, then choose which metadata fields to display during comparison.
- **Metadata display** — datasets can include arbitrary fields (description, date, tags, artist, etc.). Select which to show alongside images when loading.
- **No-image support** — items without an `imageUrl` render as blank panels. Useful for text-only comparison sets.
- **Local storage** — all ratings and comparison history persist in IndexedDB. Export as JSON anytime, or import a previous session to resume.
- **Database re-export** — if your source was a SQLite file, export the original database back with a `paired_rating` column added to your selected table. All other tables and columns are preserved with full integrity.
- **Light and dark mode** — light theme matches the minimal serif aesthetic of [thiswaifudoesnotexist.net](https://www.thiswaifudoesnotexist.net). Toggle in the top-right corner.
- **Paginated rankings** — live ranking table with 10 items per page, showing rating, win/loss record, and thumbnail.

## Dataset format

### JSON

An array of objects. Only `name` is required. `imageUrl` is optional. Any extra keys become selectable metadata fields.

```json
[
  {
    "name": "Alpine Lake",
    "imageUrl": "https://example.com/alpine.jpg",
    "photographer": "Ansel Adams",
    "year": 1938
  },
  {
    "name": "Desert Dunes",
    "imageUrl": "https://example.com/desert.jpg",
    "photographer": "Edward Weston",
    "year": 1947
  }
]
```

### SQLite

Any `.db`, `.sqlite`, or `.sqlite3` file. You choose the table, then the display fields. The first column named `id` (or the first column) is used as the item identifier for re-export.

## The model

The Bradley-Terry model assigns a strength parameter $\beta_i$ to each item. The probability of item $i$ beating item $j$ is:

$$P(i > j) = \frac{e^{\beta_i}}{e^{\beta_i} + e^{\beta_j}}$$

After each comparison where $i$ beats $j$, parameters update via gradient ascent on the log-likelihood:

$$\beta_i \leftarrow \beta_i + \eta \cdot (1 - P(i > j))$$
$$\beta_j \leftarrow \beta_j - \eta \cdot P(i > j)$$

The learning rate $\eta = 0.4$ balances responsiveness with stability. Items start at $\beta = 0$ (equal strength). Rankings are simply items sorted by $\beta$ descending.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [sql.js](https://github.com/sql-js/sql.js) for client-side SQLite
- [idb](https://github.com/jakearchibald/idb) for IndexedDB
- No backend. No dependencies beyond these three.

## Running locally

```bash
git clone https://github.com/krisyotam/whichisbetter.git
cd whichisbetter
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Sample dataset

The built-in sample loads 25 AI-generated anime faces from [This Waifu Does Not Exist](https://www.thiswaifudoesnotexist.net) (Gwern Branwen's StyleGAN 2 project). Click "Load sample dataset" on the home screen to try it without uploading anything.

## License

MIT
