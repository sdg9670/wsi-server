import express from 'express';
import AuthController from './auth.controller';
import PlaceController from './place.controller';
import UploadController from './upload.controller';

class Controller {
  router = express.Router();

  constructor() {
    // 인증
    this.router.use('/auth', new AuthController().router);
    // 업로드
    this.router.use('/upload', new UploadController().router);
    // 장소
    this.router.use('/place', new PlaceController().router);
  }
}

export default Controller;
