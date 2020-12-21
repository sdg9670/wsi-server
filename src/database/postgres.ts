import ConfigManager from '@/config';
import { Sequelize, Transaction } from 'sequelize';
import DatabaseResult from './database.result';

class Postgres {
  private static config = ConfigManager.config.db.postgres;
  private static db: Sequelize = null;

  // 구동
  async run() {
    if (Postgres.db !== null) return;
    Postgres.db = new Sequelize({
      ...Postgres.config,
      dialect: 'postgres',
    });

    await this.test();

    console.log(`Connected Postgres (max pools: ${Postgres.config.pool.max})`);
  }

  // 테스트 SQL
  private async test() {
    try {
      await Postgres.db.authenticate();
      console.log('Connection has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  }

  // 쿼리 실행
  async query(sql: string, params: { [key: string]: any } = {}) {
    const result: any = await Postgres.db.query(sql, {
      bind: params,
    });
    return new DatabaseResult(result[0], result[1].rowCount);
  }

  // 트랜잭션
  async transaction(
    tranFunc: (
      query: (
        sql: string,
        params: { [key: string]: any }
      ) => Promise<DatabaseResult>,
      commit: () => Promise<void>,
      rollback: () => Promise<void>
    ) => Promise<void>
  ) {
    let tran: Transaction = null;

    try {
      tran = await Postgres.db.transaction();

      const tranQuery = async (sql: string, params: { [key: string]: any }) => {
        const result: any = await Postgres.db.query(sql, {
          bind: params,
          transaction: tran,
        });
        return new DatabaseResult(result[0], result[1].rowCount);
      };

      await tranFunc(
        tranQuery,
        async () => {
          if (tran === null) return;
          await tran.commit();
          tran = null;
        },
        async () => {
          if (tran === null) return;
          await tran.rollback();
          tran = null;
        }
      );
    } finally {
      if (tran !== null) tran.rollback();
    }
  }
}

export default Postgres;
