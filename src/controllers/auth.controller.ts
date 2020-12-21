import Postgres from '@/database/postgres';
import express, { NextFunction, Request, Response } from 'express';
import Crypt from '@/utils/crypt';
import Jwt from '@/utils/jwt';
import ejs from 'ejs';
import path from 'path';
import nodemailer from 'nodemailer';
import ConfigManager from '@/config';
import TokenValidator from '@/middlewares/token.validator';
import e from 'express';

class AuthController {
  router = express.Router();

  constructor() {
    this.router.post('/login', this.login);
    this.router.post('/register', this.register);
    this.router.get('/duplicateEmail', this.duplicateEmail);
    this.router.post('/updateAccessToken', this.updateAccessToken);
    this.router.post('/authEmail', this.authEmail);
    this.router.post('/findPwd', this.findPwd);
    this.router.post('/resetPwd', this.resetPwd);
    this.router.post('/confirmAuthNum', this.confirmAuthNum);
    this.router.use(TokenValidator.middleware);
    this.router.post('/changePwd', this.changePwd);
  }

  private async login(req: Request, res: Response, next: NextFunction) {
    const email = req.body.email;
    const password = req.body.password;
    let accessToken: string;
    let refreshToken: string;

    const postgres = new Postgres();
    const result = await postgres.query(
      `
      SELECT email, nick_name as "nickName" FROM "user" u
      WHERE
        u.email = $email AND
        u."password" = $password AND
        u.is_use = true
    `,
      { email, password: Crypt.encrypt(password) }
    );

    if (result.one() === null) {
      res
        .status(500)
        .json({ errorCode: 1, errorMessage: '로그인에 실패하였습니다.' });
      return;
    }

    accessToken = Jwt.createAccessToken(result.one());
    refreshToken = Jwt.createRefreshToken(result.one());

    res
      .status(200)
      .cookie('accessToken', accessToken, {
        maxAge: 3600000,
        httpOnly: false,
      })
      .cookie('refreshToken', refreshToken, {
        maxAge: 3600000,
        httpOnly: false,
      })
      .json({
        isLogin: true,
        result: result.one(),
      });
  }

  private async register(req: Request, res: Response, next: NextFunction) {
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    const postgres = new Postgres();
    const result = await postgres.query(
      `
      INSERT INTO
      "user" (
        email,
        password,
        nick_name,
        is_use
      )
      VALUES (
        $email,
        $password,
        $name,
        true
      )
      `,
      { email, password: Crypt.encrypt(password), name }
    );

    res.status(200).json({ isLogin: true });
  }

  private async duplicateEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const email = req.query.email;
    console.log(email);

    const postgres = new Postgres();
    const result = await postgres.query(
      `
      SELECT
        CASE WHEN COUNT(*) > 0 THEN TRUE ELSE FALSE END AS "isDuplicateEmail"
      FROM
        "user" u
      WHERE
        u.email = $email
      `,
      { email }
    );
    const resultData = JSON.parse(JSON.stringify(result)).data[0]
      .isDuplicateEmail;
    if (resultData) {
      res
        .status(500)
        .json({ errorCode: 2, errorMessage: '이미 사용중인 이메일입니다.' });
      return;
    }

    res.status(200).json({ isLogin: true, result: resultData });
  }

  private async updateAccessToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const accessToken = Jwt.decodeToken(req.body.accessToken) as {
        [key: string]: any;
      };
      const refreshToken = Jwt.verifyToken(req.body.refreshToken) as {
        [key: string]: any;
      };
      if (accessToken.email !== refreshToken.email) {
        res.status(401).json({ errorCode: 2 });
      }

      const newAccessToken = Jwt.createAccessToken({
        email: refreshToken.email,
        nickname: refreshToken.nickname,
      });
      res
        .status(200)
        .cookie('accessToken', newAccessToken, {
          maxAge: 3600000,
          httpOnly: false,
        })
        .json();
    } catch (e) {
      console.log(e);
      res.status(401).json({ errorCode: 2 });
    }
  }

  private async authEmail(req: Request, res: Response, next: NextFunction) {
    let authNum = Math.random().toString().substr(2, 6);
    let emailTemplete;
    const email = req.body.email;

    ejs.renderFile(
      path.join(__dirname, '/../ejs/authMail.ejs'),
      {
        authCode: authNum,
      },
      (err, data) => {
        if (err) {
          console.log(err);
        }
        emailTemplete = data;
      }
    );

    let transporter = nodemailer.createTransport({
      service: 'Gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: ConfigManager.config.authEmail.user,
        pass: ConfigManager.config.authEmail.password,
      },
    });
    console.log(req.body.email);
    const mailOptions = {
      from: 'WWI',
      to: email,
      subject: '[WWI] 회원가입 인증번호',
      html: emailTemplete,
    };

    await transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log('1111', err);
        return;
      }
      console.log('Finish sending email : ' + info.response);
      transporter.close();
    });

    res.status(200).json({
      authNum: Crypt.encrypt(authNum),
    });
  }

  private async findPwd(req: Request, res: Response, next: NextFunction) {
    let emailTemplete;
    const email = req.body.email;

    const postgres = new Postgres();
    const result = await postgres.query(
      `
      SELECT
        CASE WHEN COUNT(*) > 0 THEN TRUE ELSE FALSE END AS "NotFindEmail"
      FROM
        "user" u
      WHERE
        u.email = $email
      `,
      { email }
    );
    const resultData = result.one();
    console.log(resultData);
    if (!resultData) {
      res
        .status(500)
        .json({ errorCode: 2, errorMessage: '가입되지 않은 이메일입니다.' });
      return;
    }

    const authIdx = (
      await postgres.query(
        `
      WITH i AS (
        INSERT INTO auth (
          auth_type_code
        ) VALUES (
          'E'
        )
        RETURNING
          auth_idx
      )
      UPDATE
        "user" u
      SET
        auth_idx = (SELECT * FROM i)
      WHERE
        u.email = $email
      RETURNING
        u.auth_idx
      `,
        { email }
      )
    ).one();
    console.log(authIdx);

    const authKey = (
      await postgres.query(
        `
      SELECT auth_key FROM auth a WHERE a.auth_idx = $authIdx
    `,
        { authIdx }
      )
    ).one();
    console.log(authKey);

    ejs.renderFile(
      path.join(__dirname, '/../ejs/findPwdMail.ejs'),
      {
        url: ConfigManager.config.url.web,
        authKey: authKey,
        email: email,
      },
      (err, data) => {
        if (err) {
          console.log(err);
        }
        emailTemplete = data;
      }
    );

    let transporter = nodemailer.createTransport({
      service: 'Gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: ConfigManager.config.authEmail.user,
        pass: ConfigManager.config.authEmail.password,
      },
    });

    const mailOptions = {
      from: 'WWI',
      to: email,
      subject: '[WWI] 비밀번호 재설정하기',
      html: emailTemplete,
    };

    await transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log('1111', err);
        return;
      }
      console.log('Finish sending email : ' + info.response);
      transporter.close();
    });

    res.status(200).json({
      sendEmail: true,
    });
  }

  private async resetPwd(req: Request, res: Response, next: NextFunction) {
    const password = req.body.password;
    const email = req.body.email;
    const authKey = req.body.authKey;
    console.log(email);

    const postgres = new Postgres();

    const count = (
      await postgres.query(
        `
      WITH u AS (
        UPDATE "user" u
        SET
          password = $password
        FROM auth a
        WHERE
          u.email = $email AND
          a.auth_key = $authKey AND
          a.auth_idx = u.auth_idx AND
          a.is_auth = FALSE
        RETURNING 
          u.auth_idx 
      )
      UPDATE auth
      SET
        is_auth = TRUE
      WHERE
        auth_idx = (SELECT * FROM u) 
    `,
        { password: Crypt.encrypt(password), email, authKey }
      )
    ).count();

    if (count === 0) {
      res.status(500).json({
        errorCode: 0,
        errorMessage: '이미 비밀번호를 변경하셨습니다.',
      });
      return;
    }
    console.log(count);

    res.status(200).json({ resetPwd: true });
  }

  private async confirmAuthNum(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    console.log(req.body);
    const authNum = req.body.authNum;
    const userAuthNum = req.body.userAuthNum;

    console.log(authNum, userAuthNum);
    console.log(Crypt.encrypt(userAuthNum));

    if (authNum !== Crypt.encrypt(userAuthNum)) {
      res
        .status(500)
        .json({ errorCode: 2, errorMessage: '인증번호가 일치하지 않습니다.' });
      return;
    }

    res.status(200).json({ ConfirmAuthNum: true });
  }

  private async changePwd(req: Request, res: Response, next: NextFunction) {
    const password = req.body.password;
    const email = (req.headers.user as any).email;
    console.log(password, email);
    const postgres = new Postgres();

    await postgres.query(
      `
        UPDATE "user" u
        SET
          password = $password
        WHERE
          u.email = $email
    `,
      { password: Crypt.encrypt(password), email }
    );

    res.status(200).json({ changePwd: true });
  }
}

export default AuthController;
