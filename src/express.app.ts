import express from 'express';
import Controller from '@/controllers';
import cors from 'cors';
import bodyParser from 'body-parser';
import ConfigManager from './config';
import history from 'connect-history-api-fallback';
import path from 'path';

class ExpressApp {
  private app = express();

  constructor() {
    this.setMiddleware();
    this.setController();
  }

  // 컨트롤러 설정
  private setController() {
    this.app.use('/file', express.static(ConfigManager.config.path.files));
    this.app.use('/api', new Controller().router);
    // Vue 호스팅
    this.app.use(history());
    this.app.use('/', express.static(ConfigManager.config.path.web));
  }

  // 미들웨어 설정
  private setMiddleware() {
    // Cors
    if (process.env.NODE_ENV === 'development')
      this.app.use(
        cors({ origin: ConfigManager.config.url.web, credentials: true })
      );
    this.app.use(bodyParser.json());
  }

  run() {
    this.app.listen(ConfigManager.config.express.port, () => {
      console.log(
        `express app listening (http://127.0.0.1:${ConfigManager.config.express.port})`
      );
    });
  }
}

export default ExpressApp;
