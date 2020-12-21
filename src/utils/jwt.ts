import * as jwt from 'jsonwebtoken';
import ConfigManager from '@/config';

class Jwt {
  private static config = ConfigManager.config.crypto;

  // AccessToken 생성
  public static createAccessToken(value: any) {
    const token = jwt.sign(value, Jwt.config.key, { expiresIn: '60m' });
    return token;
  }

  // RegreshToken 생성
  public static createRefreshToken(value: any) {
    const token = jwt.sign(value, Jwt.config.key, { expiresIn: '14d' });
    return token;
  }

  // 토근 컴증
  public static verifyToken(value: string) {
    const token = jwt.verify(value, Jwt.config.key);
    return token;
  }

  // 토근 복호화
  public static decodeToken(value: string) {
    const token = jwt.decode(value);
    return token;
  }
}
export default Jwt;
