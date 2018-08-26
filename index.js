const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const tmp = require('tmp');

const _makeTempfile = () => new Promise((accept, reject) => {
  tmp.file((err, path, fd, cleanup) => {
    if (!err) {
      accept({
        path,
        cleanup,
      });
    } else {
      reject(err);
    }
  });
});

module.exports = async (data = Buffer.alloc(0), opts = {}) => {
  const {
    hash = 'sha512',
    cert = Buffer.alloc(0),
    key = Buffer.alloc(0),
  } = opts;

  const files = await Promise.all([
    _makeTempfile()
      .then(o => new Promise((accept, reject) => {
        fs.writeFile(o.path, key, err => {
          if (!err) {
            accept(o);
          } else {
            reject(err);
          }
        });
      })),
    _makeTempfile()
      .then(o => new Promise((accept, reject) => {
        fs.writeFile(o.path, cert, err => {
          if (!err) {
            accept(o);
          } else {
            reject(err);
          }
        });
      })),
    _makeTempfile()
      .then(o => new Promise((accept, reject) => {
        fs.writeFile(o.path, data, err => {
          if (!err) {
            accept(o);
          } else {
            reject(err);
          }
        });
      })),
    _makeTempfile(),
  ]);

  await new Promise((accept, reject) => {
    const cp = child_process.spawn(path.join(__dirname, 'bin', 'sign-file'), [
      hash,
      files[0].path,
      files[1].path,
      files[2].path,
      files[3].path,
    ], {
      stdio: 'inherit',
    });
    cp.on('exit', code => {
      if (code === 0) {
        accept();
      } else {
        reject(new Error('child process exited with status code ' + code));
      }
    });
  });

  const resultData = await new Promise((accept, reject) => {
    fs.readFile(files[3].path, (err, data) => {
      if (!err) {
        accept(data);
      } else {
        reject(err);
      }
    });
  });

  for (let i = 0; i < files.length; i++) {
    files[i].cleanup();
  }

  return resultData;
};
