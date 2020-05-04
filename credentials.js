const fs = require('fs');
module.exports = {
    key: null,
    cert: null

    // key: fs.readFileSync('./credentials/ssl-cert-snakeoil-key.pem', 'utf8'),
    // cert: fs.readFileSync('./credentials/ssl-cert-snakeoil.pem', 'utf8')

    // key: fs.readFileSync('./credentials/key.pem', 'utf8'),
    // cert: fs.readFileSync('./credentials/cert.pem', 'utf8')

    // key: fs.readFileSync('./credentials/RootCA-key.pem', 'utf8'),
    // cert: fs.readFileSync('./credentials/RootCA.pem', 'utf8')
  };