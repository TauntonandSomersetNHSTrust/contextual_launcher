const obfuscate = require('./../lib/obfuscated-querystring-master/lib').obfuscate;
const queryString = require('querystring');
const logger = require('./../utils/logger.js');

let obconfig = null;
let requiredProperties = null;

const obfuscation = async(req, res, next) => {
  if(!obconfig) {
    obconfig = {
      encryptionKey: {
        name: process.env.SIDER_obfuscationKeyName.trim(),
        value: process.env.SIDER_obfuscationKeyValue.trim()
      },
      obfuscate: process.env.SIDER_obfuscatedParams.trim().split(',').map((a) => {
        return a.trim();
      }),
      requiredProperties: process.env.SIDER_obfuscatedRequiredParams.trim().split(',').map((a) => {
        return a.trim().toLowerCase();
      })
    };

    requiredProperties = obconfig.requiredProperties;
  }

  let keys = [];

  logger.debug('In query: ' + JSON.stringify(req.query, null, 4));

  if(req.query) {
    keys = Object.keys(req.query).map(k => k.toLowerCase());
  } else {
    return next(new Error('Query String missing from request'))
  }

  logger.debug('Keys found: ' + JSON.stringify(keys, null, 4))

  try {
    let required = requiredProperties.length;
    for(let r of requiredProperties) {
      for(let k of keys) {
        if(k == r) {
          required--;
        }
      }
    }

    if(required == 0) {
      delete req.query['token'];
      const obParams = obfuscate(queryString.stringify(req.query), obconfig);
      logger.debug('obParams: ' + JSON.stringify(obParams, null, 4));
      req.query = obParams;
    } else {
      res.status(400);
      return next(new Error('Required Parameter missing!'));
    }
  } catch(error) {
    res.status(500).send('There was an issue obfuscating the query parameters.');
    res.end();
  }

  return next();
};

module.exports = obfuscation;
