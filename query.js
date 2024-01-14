function countWordsInArray(inputArray, queryArray) {
  // Inisialisasi sebuah object untuk menyimpan the counts
  const wordCounts = {};

  // Menghitung setiap kata dalam array
  for (const word of inputArray) {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  }

  // Inisialisasi sebuah array untuk menyimpan the results.
  const result = [];

  // Menghitung beberapa kata di dalam querryArray.
  for (const word of queryArray) {
    result.push(wordCounts[word] || 0);
  }

  return result;
}

// Example usage:
const INPUT = ["xc", "dz", "bbb", "dz"];
const QUERY = ["bbb", "ac", "dz"];

const output = countWordsInArray(INPUT, QUERY);
console.log(output);
