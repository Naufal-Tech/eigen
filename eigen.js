function reverseAlphabet(string) {
  const letters = string.slice(0, -1).split("").reverse();
  const result = letters.join("") + string.slice(-1);
  return result;
}

console.log(reverseAlphabet("NEGIE1"));
