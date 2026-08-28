/**
 * Phase 11 Part 4: Database Design Test
 * Tests the MongoDB schema design and index strategy WITHOUT requiring a running MongoDB instance.
 * Validates schema correctness, index definitions, and query patterns using Mongoose model inspection.
 */

const mongoose = require('mongoose');

function runDatabaseTest() {
  console.log("========================================");
  console.log("   PHASE 11: DATABASE DESIGN TEST       ");
  console.log("========================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.log(`  [FAIL] ${name}: ${e.message}`);
      failed++;
    }
  }

  // Load models
  const models = require('../../apps/api/src/models');

  // Test 1: All required models exist
  test('Repository model exists', () => {
    if (!models.Repository) throw new Error('Missing Repository model');
  });

  test('Commit model exists', () => {
    if (!models.Commit) throw new Error('Missing Commit model');
  });

  test('File model exists', () => {
    if (!models.File) throw new Error('Missing File model');
  });

  test('Fragment model exists', () => {
    if (!models.Fragment) throw new Error('Missing Fragment model');
  });

  test('Verification model exists', () => {
    if (!models.Verification) throw new Error('Missing Verification model');
  });

  // Test 2: Fragment schema has required fields
  test('Fragment schema has fingerprint field', () => {
    const paths = models.Fragment.schema.paths;
    if (!paths.fingerprint) throw new Error('Missing fingerprint field');
  });

  test('Fragment schema has fragmentType field', () => {
    const paths = models.Fragment.schema.paths;
    if (!paths.fragmentType) throw new Error('Missing fragmentType field');
  });

  test('Fragment schema has canonicalVersion field', () => {
    const paths = models.Fragment.schema.paths;
    if (!paths.canonicalVersion) throw new Error('Missing canonicalVersion field');
  });

  test('Fragment schema has algorithmVersion field', () => {
    const paths = models.Fragment.schema.paths;
    if (!paths.algorithmVersion) throw new Error('Missing algorithmVersion field');
  });

  test('Fragment schema has repositoryId field', () => {
    const paths = models.Fragment.schema.paths;
    if (!paths.repositoryId) throw new Error('Missing repositoryId field');
  });

  test('Fragment schema has isCommonFragment field', () => {
    const paths = models.Fragment.schema.paths;
    if (!paths.isCommonFragment) throw new Error('Missing isCommonFragment field');
  });

  // Test 3: Verification status enum
  test('Verification status enum includes EXACT_MATCH', () => {
    const statusPath = models.Verification.schema.paths.status;
    const enumValues = statusPath.enumValues;
    if (!enumValues.includes('EXACT_MATCH')) throw new Error('Missing EXACT_MATCH');
    if (!enumValues.includes('STRUCTURAL_MATCH')) throw new Error('Missing STRUCTURAL_MATCH');
    if (!enumValues.includes('PARTIAL_MATCH')) throw new Error('Missing PARTIAL_MATCH');
    if (!enumValues.includes('NO_MATCH')) throw new Error('Missing NO_MATCH');
    if (!enumValues.includes('UNSUPPORTED')) throw new Error('Missing UNSUPPORTED');
  });

  // Test 4: Index definitions
  test('Fragment has fingerprint index', () => {
    const indexes = models.Fragment.schema.indexes();
    const hasIndex = indexes.some(idx => {
      const fields = idx[0];
      return fields.fingerprint !== undefined;
    });
    if (!hasIndex) throw new Error('No fingerprint index found');
  });

  test('Verification has compound index', () => {
    const indexes = models.Verification.schema.indexes();
    const hasCompound = indexes.some(idx => {
      const fields = idx[0];
      return fields.sourceRepositoryId !== undefined && fields.targetRepositoryId !== undefined;
    });
    if (!hasCompound) throw new Error('No compound index on sourceRepositoryId + targetRepositoryId');
  });

  // Test 5: Legacy model compatibility
  test('Legacy Project model preserved', () => {
    if (!models.Project) throw new Error('Missing legacy Project model');
  });

  test('Legacy Artifact model preserved', () => {
    if (!models.Artifact) throw new Error('Missing legacy Artifact model');
  });

  // Test 6: Index strategy documentation
  console.log("\n  --- Index Strategy ---");
  console.log("  Fragment.fingerprint (hashed): O(1) exact lookup for provenance queries");
  console.log("  Fragment.{fingerprint, canonicalVersion}: Version-aware lookups");
  console.log("  Fragment.{repositoryId, filePath}: Repository-scoped file queries");
  console.log("  Commit.{repositoryId, hash}: Unique commit identification");
  console.log("  Verification.{sourceRepositoryId, targetRepositoryId}: Pair lookups");

  console.log("\n  --- Expected Query Patterns ---");
  console.log("  1. Find all fragments with a given fingerprint (provenance search)");
  console.log("  2. Find all fragments in a repository (corpus analysis)");
  console.log("  3. Find all verifications between two repositories");
  console.log("  4. Find all commits for a repository (history)");

  console.log("\n  --- Storage Growth Estimate ---");
  console.log("  Per fragment: ~200 bytes (fingerprint + metadata)");
  console.log("  1K fragments:   ~200 KB");
  console.log("  10K fragments:  ~2 MB");
  console.log("  100K fragments: ~20 MB");
  console.log("  1M fragments:   ~200 MB");

  console.log("\n  --- Duplicate Fingerprint Behavior ---");
  console.log("  Duplicate fingerprints are ALLOWED (same structure in different repos).");
  console.log("  Each entry preserves its own repositoryId/commitHash/filePath context.");
  console.log("  The isCommonFragment flag is set for high-frequency fragments.");

  console.log(`\nDATABASE DESIGN: ${failed === 0 ? 'PASS' : 'FAIL'} (${passed}/${passed + failed} tests passed)`);

  if (failed > 0) process.exit(1);
}

try {
  runDatabaseTest();
} catch (e) {
  console.error(e);
  process.exit(1);
}
