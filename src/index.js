const express = require('express');
const ponaserv = require('ponaserv');
const log = require('consola');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const path = require('path');

const { PORT } = require('./config');

const app = express();

app.use(morgan('tiny'));
app.use(helmet());
app.use(cors());

ponaserv(app, {
  services: path.join(__dirname, 'services'),
  // debug: true,
});

app.listen(PORT, () => {
  log.info('Listening on port', PORT);
});
