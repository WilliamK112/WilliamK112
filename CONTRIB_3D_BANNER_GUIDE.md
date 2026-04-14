# Approved 3D Contribution Banner Guide

This repo has one approved visual language for the GitHub profile 3D contribution banner.

## Canonical rule

Use the approved white-card isometric cube style.

Do not change:
- shape language
- perspective
- composition
- color system
- title/subtitle placement
- general visual feel

The approved family is based on:
- `assets/blue-gold-3d-contrib-v32.png`
- the current geometry used by `scripts/update-approved-3d-banner.py`

## Hard constraints

1. Newest GitHub activity must appear on the **right**.
2. Use the last **53 GitHub weeks**, oldest to newest, left to right.
3. Keep the white background card and the same isometric cube geometry.
4. Do **not** introduce a new layout just because a new generator exists.
5. Do **not** update `README.md` to a new preview version before visual approval.

## One canonical updater

Use this script only:

```bash
python3 scripts/update-approved-3d-banner.py --version v35 --reveal
```

That generates a local preview without touching the approved README asset.

After visual approval, overwrite the approved asset in place:

```bash
python3 scripts/update-approved-3d-banner.py --overwrite-approved --reveal
```

That will:
- overwrite `assets/blue-gold-3d-contrib-v32.svg`
- overwrite `assets/blue-gold-3d-contrib-v32.png`
- refresh the contribution count in `README.md` alt text

## Data source

Preferred:
- GitHub GraphQL contribution calendar

The updater supports:
- `GITHUB_TOKEN` environment variable, or
- local `gh` auth as fallback

## Retired / invalid paths

Do not use these retired files or approaches again:
- `scripts/generate-3d-contrib.mjs`
- `scripts/generate-3d-contrib-v18.mjs`
- `assets/update_contrib.py`
- `assets/gen_contrib.py`
- `gen_real.py`
- `auto_update.py`
- `ocr_update.py`
- `preview_contrib.py`
- old preview / tune html files
- invalid output drafts such as `v33` and `v34`

## Workflow note

GitHub Actions should call the canonical updater, not any retired generator.

## Safe operating procedure

1. Generate a preview first.
2. Open it in Finder and compare against the approved look.
3. Only after approval, overwrite `v32`.
4. Keep README pointed at `v32` unless the approved asset name is intentionally changed.

## Why this exists

Previous attempts failed because newer scripts changed the whole visual system instead of updating data inside the approved one.

This file exists so future humans and future AI do not repeat that mistake.
