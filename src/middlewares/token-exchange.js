const jwt = require('jsonwebtoken');
const _ = require('lodash');
const jwksClient = require('jwks-rsa');
const https = require('https');
const queryString = require('querystring');

// Set Up Logging
const audit = require('./../utils/auditlogger.js');
const logger = require('./../utils/logger.js');

async function getSigningKey(token) {
	return new Promise((resolve, reject) => {
		const client = jwksClient({
			strictSsl: true, // Default value
			jwksUri: (process.env.jwksUri)
		});
		const decoded = jwt.decode(token, {complete: true});
		client.getSigningKey(decoded.header.kid, (err, key) => {
			if(err) {
				logger.error(err);
				reject(err);
			} else {
				const signingKey = key.publicKey || key.rsaPublicKey;
				resolve(signingKey);
			}
		});
	});
}

async function getOpenIDEndpoints() {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'accept': 'application/json'
      }
    };

    https.get(process.env.downstream_OpenIDBaseURL, options, (res) => {
			res.setEncoding('utf8');
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				if(res.statusCode == 200) {
          return resolve(JSON.parse(data));
        } else {
          return reject(JSON.stringify({
						message: 'getOpenIDEndpoints failed',
            responseCode: res.statusCode,
            responseBody: data
          }));
        }
			});
		}).on('error', (ex) => {
			logger.warn('Error parsing demographic data' + JSON.stringify(ex, null, 4));
			reject(new Error(ex));
		});
  });
}


async function serviceAuthenticate(tokenUrl) {
	logger.debug('Service Authenticate: ' + tokenUrl)
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
  }};

  const form = {
		grant_type: 'client_credentials',
		client_id: (process.env.downstream_openIDClientID),
		client_secret: (process.env.dowstream_openIDClientSecret),
  	reqested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
	};

	const formData = queryString.stringify(form);

  return new Promise((resolve, reject) => {
		const reqs = https.request(tokenUrl, options, (ress) => {
			ress.setEncoding('utf8');
			ress.on('data', (d) => {
				const json = JSON.parse(d);
        if(ress.statusCode == 200) {
          return resolve(json);
        } else {
          return reject(JSON.stringify({mesage: 'serviceAuthenticate failed', responseCode : ress.statusCode, responseBody: ress.body}));
        }
			});
		});

		reqs.on('error', (e) => {
			logger.error('Error authenticating service: ' + JSON.stringify(e, null, 4));
			return reject('Error authenticating service: ' + JSON.stringify(e, null, 4));
		});

		reqs.write(formData);

		reqs.end();
	});
}


async function serviceTokenExchange(tokenUrl, subjectToken, user) {
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
  }};

  const form = {
		grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
		requested_subject: user,
		subject_token: subjectToken,
		client_id: process.env.downstream_openIDClientID,
		client_secret: process.env.dowstream_openIDClientSecret,
		requested_token_type:'urn:ietf:params:oauth:token-type:access_token',
		audience: process.env.downstream_openIDTargetClient
	};

	logger.debug('Form data: ' + JSON.stringify(form, null, 4));

	const formData = queryString.stringify(form);

  return new Promise((resolve, reject) => {
		const reqs = https.request(tokenUrl, options, (ress) => {
			ress.setEncoding('utf8');
			ress.on('data', (d) => {
				const json = JSON.parse(d);
        if(ress.statusCode == 200) {
          return resolve(json);
        } else {
          return reject(JSON.stringify({message: 'serviceTokenExchange failed', responseCode : ress.statusCode, responseBody: ress.body, json: JSON.stringify(json, null, 4)}));
        }
			});
		});

		reqs.on('error', (e) => {
			logger.error('Error exchanging token: ' + JSON.stringify(e, null, 4));
			return reject('Error exchanging token: ' + JSON.stringify(e, null, 4));
		});

		reqs.write(formData);

		reqs.end();
	});
}

module.exports = async (req, res, next) => {
  logger.debug('Checking downstream auth reqs');
  try {
    if(process.env.downstream_enabled.trim().toLowerCase() == 'true') {
      logger.debug('OpenID token echange required');
      const targetGlient = process.env.downstream_openIDTargetClient;
      const openIDData = await getOpenIDEndpoints();
			logger.debug('Open ID Endpoints: ' + JSON.stringify(openIDData, null, 4));
      const serviceAuth = await serviceAuthenticate(openIDData['token_endpoint']);
			logger.debug('Service Auth: ' + JSON.stringify(serviceAuth, null, 4));
      const targetUser = req.query['practitioner'].split('|')[1];
      const serviceEx = await serviceTokenExchange(openIDData['token_endpoint'], serviceAuth['access_token'], targetUser);
      req.access_token = serviceEx['access_token'];
      next();
    } else {
      throw new Error('Method not supported');
    }
  } catch(err) {
    audit.error('Downstream Audit Failure: ' + err);
    logger.error(err);
    res.status(401).send('Could not exchange security tokens and proceed.');
    res.end();
  }
};
