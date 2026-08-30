const { createRepositoryVerificationReceipt } = require('./packages/verification-engine/receipt');
const data = { classification: 'MATCH', matchData: { matchedFragments: [], missingFragments: [], addedFragments: [] } };
const r1 = createRepositoryVerificationReceipt(data, {});
const r2 = createRepositoryVerificationReceipt(data, {});
console.log(r1.verificationId);
console.log(r2.verificationId);
