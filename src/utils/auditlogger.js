const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

const logDir = process.env.LogDir;

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: `${logDir}/%DATE%-audit.log`,
  datePattern: 'YYYY-MM-DD',
  format: format.combine(
        format.printf(
          info =>
            `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
        )
    )
});

const consoleTransport = new transports.Console({
	level: 'warn',
	format: format.combine(
		format.colorize(),
		format.printf(
			info =>
				`${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
		)
	)
});


const logger = createLogger({
  // change level if in dev environment versus production
  level: 'info',
  format: format.combine(
	format.label({ label: path.basename(process.mainModule.filename) }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  transports: [
    consoleTransport,
    dailyRotateFileTransport
  ]
});

module.exports = logger;
