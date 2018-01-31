module.exports = function pretty(str) {
  let [mindent] = str
    .split('\n')
    .filter(line => !/^\s*$/.test(line))
    .map(line => line.match(/^ */)[0])
    .sort();

  return str
    .trim()
    .replace(new RegExp(`^${mindent}`, 'mg'), '')
    .replace(/^\s+$/mg, '')
    .replace(/\n\n+/g, '\n\n');
}
