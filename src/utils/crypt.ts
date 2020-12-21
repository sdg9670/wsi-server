import ConfigManager from '@/config';
import crypto from 'crypto';

class Crypt {
  private static config = ConfigManager.config.crypto;

  // 암호화
  public static encrypt(value: string) {
    const sha512Hash = crypto.createHmac('sha512', Crypt.config.key);
    return sha512Hash.update(value).digest('hex');
  }
}

export default Crypt;
