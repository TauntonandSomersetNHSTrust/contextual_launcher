// custom-env wouldn't load direct from NODE_ENV for some reason
let prod = true;
if(process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() === 'production') {
	require('custom-env').env('production');
} else {
	require('custom-env').env('development');
	prod = false;
}

const logger = require('./utils/logger');

logger.system('Loading lookups...');

logger.system(`Running in ${process.env.NODE_ENV} mode!`);

logger.system('Running on ' + process.env.host);

// Express HTTP server
const express = require('express');
const server = express();
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');

if (!('toJSON' in Error.prototype))
Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
        var alt = {};

        Object.getOwnPropertyNames(this).forEach(function (key) {
            alt[key] = this[key];
        }, this);

        return alt;
    },
    configurable: true,
    writable: true
});

// Middleware
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: false}));

const nocache = require('nocache');
server.use(nocache());
server.set('etag', false);

// router
const endpoints = require("./endpoints");

server.use('/', endpoints);

server.listen(process.env.listenOn, prod ? 'localhost' : null, () => {
	logger.system('Listening on port '+process.env.listenOn);
	logger.system(prod ? 'Local access only' : 'Remote access allowed');
});
