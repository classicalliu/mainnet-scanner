import Knex, { Knex as KnexType } from "knex";
import { Config } from "./config";
import { DB } from "./types";

const poolMax = 20;
const GLOBAL_KNEX = Knex({
  client: "postgresql",
  connection: {
    connectionString: Config.databaseUrl,
    keepAlive: true,
  },
  pool: { min: 2, max: +poolMax },
});

export class Query {
  private knex: KnexType;
  private currentTipKey = "current_tip";

  constructor() {
    this.knex = GLOBAL_KNEX;
  }

  async updateCurrentTip(tip: bigint) {
    // const one = await this.knex<DB.Flag>(DB.FLAGS_TABLE_NAME)
    // .where({ key: this.currentTipKey })
    // .first();

    // if (one != null) {
    await this.knex<DB.Flag>(DB.FLAGS_TABLE_NAME)
      .where({
        key: this.currentTipKey,
      })
      .update({
        value: tip.toString(),
      });
    // }

    // await this.knex<DB.Flag>(DB.FLAGS_TABLE_NAME)
    //   .insert({
    //     key: this.currentTipKey,
    //     value: tip.toString(),
    //   })
  }

  async getCurrentTip(): Promise<bigint> {
    const one = await this.knex<DB.Flag>(DB.FLAGS_TABLE_NAME)
      .where({ key: this.currentTipKey })
      .first();

    if (one != null) {
      return BigInt(one.value);
    }

    return 0n;
  }

  async getTokenTipBlockNumber(): Promise<bigint> {
    const blockNumber = await this.knex<DB.Token>(DB.TOKENS_TABLE_NAME).max(
      "block_number"
    );

    const tip: string | null = blockNumber[0].max;
    if (tip == null) {
      return 0n;
    }
    return BigInt(tip);
  }

  public async save(c: DB.Contract, f: DB.FactoryScript, t: DB.Token) {
    const contractId = await this.saveContract(c);
    const factoryId = await this.saveFactory(f);
    await this.saveToken(t, factoryId, contractId);
  }

  public async saveContract(c: DB.Contract): Promise<string> {
    const one = await this.knex<DB.Contract>(DB.CONTRACTS_TABLE_NAME)
      .where({
        code_hash: c.code_hash,
        hash_type: c.hash_type,
      })
      .first();
    if (one != null) {
      return one.id!;
    }

    const result = await this.knex<DB.Contract>(DB.CONTRACTS_TABLE_NAME)
      .insert({
        code_hash: c.code_hash,
        hash_type: c.hash_type,
      })
      .returning("id");

    const id = result[0].id!;
    return id;
  }

  public async saveFactory(f: DB.FactoryScript): Promise<string> {
    const one = await this.knex<DB.FactoryScript>(DB.FACTORY_SCRIPTS_TABLE_NAME)
      .where({
        code_hash: f.code_hash,
        hash_type: f.hash_type,
        args: f.args,
      })
      .first();

    if (one != null) {
      return one.id!;
    }

    const result = await this.knex<DB.FactoryScript>(
      DB.FACTORY_SCRIPTS_TABLE_NAME
    )
      .insert({
        code_hash: f.code_hash,
        hash_type: f.hash_type,
        args: f.args,
      })
      .returning("id");

    const id = result[0].id!;
    return id;
  }

  public async saveToken(
    token: DB.Token,
    factoryScriptId: string,
    contractId: string
  ) {
    const one = await this.knex<DB.Token>(DB.TOKENS_TABLE_NAME)
      .where({
        out_point_tx_hash: token.out_point_tx_hash,
        out_point_index: token.out_point_index,
      })
      .first();

    if (one != null) {
      return;
    }

    await this.knex<DB.Token>(DB.TOKENS_TABLE_NAME).insert({
      out_point_tx_hash: token.out_point_tx_hash,
      out_point_index: token.out_point_index,
      block_number: token.block_number,
      factory_script_id: factoryScriptId,
      contract_id: contractId,
    });
  }
}
