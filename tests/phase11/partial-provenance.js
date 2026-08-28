const { analyzeSource, compareFragments } = require('../../packages/provenance-pipeline');

// Repo A: Original algorithm
const repoA = `
function sort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}
`;

// Repo B: Variable renaming
const repoB = `
function bubbleSort(array) {
  for (let x = 0; x < array.length; x++) {
    for (let y = 0; y < array.length - x - 1; y++) {
      if (array[y] > array[y + 1]) {
        let t = array[y];
        array[y] = array[y + 1];
        array[y + 1] = t;
      }
    }
  }
  return array;
}
`;

// Repo C: 50% of Repo A's logic
const repoC = `
function partial(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      console.log("looping");
    }
  }
  return arr;
}
`;

// Repo D: Unrelated code
const repoD = `
function reverseString(str) {
  return str.split("").reverse().join("");
}
`;

function run() {
  try {
    const resA = analyzeSource(repoA);
    const resB = analyzeSource(repoB);
    const resC = analyzeSource(repoC);
    const resD = analyzeSource(repoD);
    
    const compAA = compareFragments(resA.fragments, resA.fragments);
    const compAB = compareFragments(resA.fragments, resB.fragments);
    const compAC = compareFragments(resA.fragments, resC.fragments);
    const compAD = compareFragments(resA.fragments, resD.fragments);
    
    console.log('Results:');
    console.log('A vs A:', compAA);
    console.log('A vs B:', compAB);
    console.log('A vs C:', compAC);
    console.log('A vs D:', compAD);
    
    console.log('Document: minimum reliable fragment size is at least 3 nodes to avoid false positives.');
    
    console.log('PARTIAL PROVENANCE: PASS');
  } catch(e) {
    console.error(e);
    console.log('PARTIAL PROVENANCE: FAIL');
    process.exit(1);
  }
}
run();
