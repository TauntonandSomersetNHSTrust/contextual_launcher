const logger = require('./utils/logger');
const verifyToken = require('./handlers/verify-token');
const express = require('express');
const router = express.Router();
const utils = require('./utils/utils');
const queryString = require('querystring');
const obfuscate = require('./middlewares/obfuscate');
const tokenExchange = require('./middlewares/token-exchange');

const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch(next);
};

const start_time = new Date();
function getUptime() {
	return utils.getDateDiffInString(start_time.getTime(), Date.now());
}

const testEndpoint = async (req,res,next) => {
  logger.debug('testing endpoint');
	res.status(200).json({
		message: 'Test Endpoint Working'
	});
};

const launchRedirect = async (req, res, next) => {
  logger.debug('Building redirect URL');
  if(req) {
    if(req.access_token != undefined) {
      //req.query.access_token = req.access_token;
      logger.debug('query string: ' + req.query);
      const redir =  process.env.SIDER_launch_redirect_url + '#!/launch' + '?' + req.query + '&access_token=' + req.access_token;
      logger.debug('Redirecting to: ' + redir);
      res.redirect(redir);
    } else {
      return res.status(401).send('There was no access token provided to redirect.');
    }
  } else {
    return res.status(400).send('Request was empty');
  }
};

// Routes
router.get('/launch', verifyToken, tokenExchange, obfuscate, asyncMiddleware(launchRedirect));
// router.post('/login/*', asyncMiddleware(openIDLogin));
router.use('/status', asyncMiddleware((req, res, next) => {
  return res.json('OK').status(200);
}));

//Tests
router.get('/test', asyncMiddleware(testEndpoint));
router.get('/securetest', verifyToken, asyncMiddleware(testEndpoint));
router.get('/stats', verifyToken, asyncMiddleware((req, res, next) => {
	return res.status(200).json({
		uptime: getUptime()
	});
}));

router.use('/logs', require('./utils/logger-endpoints'));

module.exports = router;
