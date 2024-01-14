function diagonalDifference(matrix) {
  // Inisialisasi sums untuk kedua diagonal
  let diagonal1Sum = 0;
  let diagonal2Sum = 0;

  // Looping for the matrix to calculate sums buat kedua diagonal
  for (let i = 0; i < matrix.length; i++) {
    diagonal1Sum += matrix[i][i];
    diagonal2Sum += matrix[i][matrix.length - 1 - i];
  }

  // Kalkulasi the absolute difference between the sums
  const result = Math.abs(diagonal1Sum - diagonal2Sum);

  return result;
}

// Example usage:
const matrix = [
  [1, 2, 0],
  [4, 5, 6],
  [7, 8, 9],
];

const result = diagonalDifference(matrix);
console.log(result); // Output: 3
