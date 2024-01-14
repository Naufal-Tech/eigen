function findLongestWord(sentence) {
  // Split kalimat menjadi array of words
  const words = sentence.split(/\s+/);

  // Inisiasi variables untuk menyimpan word yang paling panjang dan its length
  let longestWords = [];
  let maxLength = 0;

  // Iterate atau loop melalui setiap kata in the array
  for (const word of words) {
    // Menghapus tanda baca dalam setiap kata
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

    // Check jika kata ini sama panjangnya dengan kata sekarang
    if (cleanWord.length === maxLength) {
      longestWords.push(cleanWord);
    } else if (cleanWord.length > maxLength) {
      // Jika kata ini lebih panjang
      longestWords = [cleanWord];
      maxLength = cleanWord.length;
    }
  }

  // Return kata yang paling panjang
  return longestWords[Math.floor(Math.random() * longestWords.length)];
}

// Example usage:
const sentence = "Saya sangat senang mengerjakan soal algoritma";
const longestWord = findLongestWord(sentence);
console.log(longestWord); // Output: "mengerjakan"
