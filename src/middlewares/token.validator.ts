import Jwt from '@/utils/jwt';
import express, { Request, Response, NextFunction } from 'express';

class TokenValidator {
  // authorization Bearer 인증
  static middleware(req: Request, res: Response, next: NextFunction) {
    let token = req.headers.authorization ? req.headers.authorization : null;
    console.log(req.headers.authorization);

    if (token !== null && token.startsWith('Bearer ')) {
      const splToken = token.split(' ');
      if (splToken.length === 2) token = splToken[1];
    }

    try {
      const decodeToken = Jwt.verifyToken(token);
      req.headers.user = decodeToken as any;
      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        res.status(401).json({ errorCode: 1 });
      } else {
        res.status(401).json({ errorCode: 2 });
      }
    }
  }
}

export default TokenValidator;
