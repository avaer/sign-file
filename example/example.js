const fs = require('fs');
const signFile = require('..');

(async () => {
  const result = await signFile(Buffer.from('test', 'utf8'), {
    hash: 'sha512',
    key: fs.readFileSync('test.key'),
    cert: fs.readFileSync('test.crt'),
  });
  process.stdout.write(result);
})();
