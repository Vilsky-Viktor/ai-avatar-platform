#!/usr/bin/env bash
# Converts job documents where createdAt is stored as a plain map { _seconds, _nanoseconds }
# to a proper Firestore Timestamp. Run this once after deploying the fix.
#
# Usage:
#   PROJECT_ID=<id> DB_NAME=<db> JOBS_COLLECTION_NAME=<collection> ./scripts/migrate-createdAt.sh

set -euo pipefail

: "${PROJECT_ID:?PROJECT_ID is required}"
: "${JOBS_COLLECTION_NAME:?JOBS_COLLECTION_NAME is required}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_MODULES="$REPO_ROOT/job-manager/node_modules"

NODE_PATH="$NODE_MODULES" node - <<'SCRIPT'
const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const PROJECT_ID = process.env.PROJECT_ID;
const DB_NAME = process.env.DB_NAME || '';
const COLLECTION = process.env.JOBS_COLLECTION_NAME;

admin.initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(DB_NAME || undefined);

const BATCH_SIZE = 400;

async function migrate() {
  let totalScanned = 0;
  let totalFixed = 0;
  let lastDoc;

  console.log(`Scanning "${COLLECTION}" in project "${PROJECT_ID}" db "${DB_NAME || '(default)'}"`);

  while (true) {
    let q = db.collection(COLLECTION).limit(BATCH_SIZE);
    if (lastDoc) q = q.startAfter(lastDoc);

    const snapshot = await q.get();
    if (snapshot.empty) break;

    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      totalScanned++;
      const createdAt = doc.data().createdAt;

      if (createdAt && !(createdAt instanceof Timestamp) && typeof createdAt._seconds === 'number') {
        batch.update(doc.ref, { createdAt: new Timestamp(createdAt._seconds, createdAt._nanoseconds || 0) });
        batchCount++;
        totalFixed++;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`  Fixed ${batchCount} docs (total fixed: ${totalFixed}, scanned: ${totalScanned})`);
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < BATCH_SIZE) break;
  }

  console.log(`\nDone. Scanned: ${totalScanned}, Fixed: ${totalFixed}`);
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });
SCRIPT
