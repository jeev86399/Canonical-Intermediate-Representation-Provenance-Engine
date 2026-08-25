# Phase 9: Serialization Ambiguity Results

## Objective
To ensure that the JSON-based hashing does not accidentally collide distinct AST structures or falsely separate identical structures due to map ordering.

## Tests Performed
1. **Key Ordering**: Evaluated if object properties defined in different orders result in different hashes.
2. **Missing Properties**: Evaluated if an empty array `[]` collides with an undefined property.
3. **Escaped Sequences**: Evaluated if a newline character `\n` in a string literal collides with an explicitly escaped literal `\\n`.

## Results
- **Key Ordering**: `scrubIdentifiers` safely sorts keys alphabetically. The serialization is totally independent of V8 object construction order.
- **Empty Array vs Undefined**: The serialization cleanly distinguishes `args: []` from no `args` property.
- **String Escaping**: `JSON.stringify` safely encodes `\n` vs `\\n` differentially.

## Conclusion
The fundamental block serialization (`Iteration 0`) is robust against ambiguity.
