class DatabaseResult {
  private data: Array<any> = null;
  private rowCount: number = null;

  constructor(data: Array<any>, rowCount: number) {
    this.data = data;
    this.rowCount = rowCount;
  }

  // DB 모든 결과 (Array)
  all() {
    return this.data;
  }

  // DB 결과 값 하나 (Object)
  one() {
    if (this.data.length === 0) return null;

    if (this.data.length > 1) return this.data;

    const tmp = this.data[0];
    const tmpKeys = Object.keys(tmp);
    if (tmpKeys.length === 1) return tmp[tmpKeys[0]];
    else if (tmpKeys.length === 0) return null;
    else return tmp;
  }

  // 갯수
  count() {
    return this.rowCount;
  }
}

export default DatabaseResult;
