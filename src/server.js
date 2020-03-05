// App server
import dotenv from 'dotenv';
dotenv.config();

import webService from './web-service/web-service.js';
import logger from './logger.js';

webService.listen(process.env.PORT || 8000, () => {
  logger.info('Web server is listening on port ' + process.env.PORT);
});
