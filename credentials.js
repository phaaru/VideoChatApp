const fs = require('fs');
module.exports = {
    // key: null,
    // cert: null
    key: fs.readFileSync('ssl-cert-snakeoil-key.pem', 'utf8'),
    cert: fs.readFileSync('ssl-cert-snakeoil.pem', 'utf8')
  };