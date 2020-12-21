import multer from 'multer';
import express, { NextFunction, Request, Response } from 'express';
import ConfigManager from '@/config';
import path from 'path';

class UploadController {
  private config = ConfigManager.config;
  router = express.Router();

  constructor() {
    this.router.post('/', this.getMulter(), this.addFile);
    this.router.delete('/', this.deleteFile);
  }

  // Multer 설정
  private getMulter() {
    return multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.config.path.files);
        },
        filename: (req, file, cb) => {
          const filename =
            new Date().getTime().toString(36) +
            Math.random().toString(36).slice(2) +
            file.originalname.match(/\.[0-9a-z]+$/i)[0];
          cb(null, filename);
        },
      }),
    }).single('file');
  }

  // 파일 업로드
  private async addFile(req: Request, res: Response, next: NextFunction) {
    res.status(200).json({ fileName: req.file.filename });
  }

  // 파일 삭제
  private async deleteFile(req: Request, res: Response, next: NextFunction) {
    res.status(200).json({ delete: true });
  }
}

export default UploadController;
