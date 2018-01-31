module.exports = function normalize(str) {
  return str.toLowerCase().replace(/[^a-z]/g, '_');
}
