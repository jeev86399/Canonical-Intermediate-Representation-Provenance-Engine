# Repository Ingestion Security

## Core Constraints
To transition CIPE from a controlled algorithm to a production-grade hostile input analyzer, we must treat all source input as untrusted.

### Hard Technical Boundaries
- `MAX_FILE_SIZE_BYTES`: 1 MB
- `MAX_REPO_FILES`: 10,000 files
- `MAX_TOTAL_SIZE_BYTES`: 100 MB
- `MAX_DEPTH`: 10 levels deep
- `ALLOWED_EXTENSIONS`: Only source files (`.js`, `.ts`, `.jsx`, etc.)

### Attack Vectors Prevented
1. **Path Traversal:** Handled strictly via Node's `path.resolve` bound checking and `git show` sandboxing.
2. **Symlink Attacks:** Handled by enforcing `lstatSync.isSymbolicLink()` rejection.
3. **Zip/Binary Bombs:** Zero-byte checks prevent binary executables from masquerading as `.js` files and crashing the V8 parser.
4. **Execution Attacks:** We strictly parse code as an AST. No `eval`, `vm.runInContext`, or `child_process` interactions ever run the target source.
