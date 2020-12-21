import defaultConfig from './default.json';
import deepmerge from 'deepmerge';

class ConfigManager {
  // 깊은 복사로 기본 설정에 NODE_ENV 덮어씌우기
  static config = deepmerge(
    defaultConfig,
    require(`./${process.env.NODE_ENV}.json`)
  );
}

export default ConfigManager;
