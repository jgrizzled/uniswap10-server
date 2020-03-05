// logger
import dotenv from 'dotenv';
dotenv.config();
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.File({ filename: 'info.log' })]
});

// fix to display formatted error stacks in console
const displayStack = winston.format(info => {
  if (info.stack) {
    info.message = info.stack;
    delete info.stack;
  }
  delete info.timestamp;
  return info;
});

// print to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(displayStack(), winston.format.simple())
    })
  );
}

export default logger;
