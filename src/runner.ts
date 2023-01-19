import { Output } from "@ckb-lumos/base";
import { RPC } from "@ckb-lumos/rpc";
import { BaseRunner } from "./base_runner";
import { Config } from "./config";
import { logger } from "./logger";
import { Query } from "./query";
import { DB, HexString, Script, HashType } from "./types";

export class Runner extends BaseRunner {
  private currentBlockNumber: bigint = 0n;
  private rpc: RPC;
  private query: Query;

  constructor() {
    super();
    this.rpc = new RPC(Config.ckbRPC);
    this.query = new Query();
    logger.info(`scan on ${Config.ckbRPC}`);
  }

  public async startForever() {
    const tipBlockNumber = await this.query.getCurrentTip();
    logger.info("from db tip block number:", tipBlockNumber);
    this.currentBlockNumber = tipBlockNumber + 1n;
    return super.startForever();
  }

  public async poll() {
    while (true) {
      const count = +Config.fetchCount;

      const results = await Promise.all(
        [...Array(count).keys()]
          .map((n) => this.currentBlockNumber + BigInt(n))
          .map((num) => {
            return this.processOneBlock(num);
          })
      );

      if (results.includes(false)) {
        break;
      }

      // const result = await this.processOneBlock(this.currentBlockNumber);
      // if (result === false) {
      //   break;
      // }

      // increase block number

      if (this.currentBlockNumber % 100n === 0n) {
        logger.info(`update current tip to: ${this.currentBlockNumber}`);
        await this.query.updateCurrentTip(this.currentBlockNumber);
      }

      this.currentBlockNumber += BigInt(count);
    }

    return 1000;
  }

  async processOneBlock(blockNumber: bigint): Promise<boolean> {
    logger.debug(`current block number: ${blockNumber}`);

    const block = await this.rpc.getBlockByNumber(blockNumber);
    if (block == null) {
      logger.info(`break by null block: ${blockNumber}`);
      return false;
    }
    const cells: {
      output: Output;
      data: string;
      tx_hash: string;
      index: number;
    }[] = [];
    block.transactions.forEach((tx) => {
      tx.outputsData.forEach((outputData, index) => {
        if (outputData.startsWith(Config.tokenDataHeader)) {
          logger.info(
            `Found one token: {tx_hash: ${tx.hash}, index: ${index}}`
          );
          cells.push({
            output: tx.outputs[index],
            data: outputData,
            tx_hash: tx.hash!,
            index,
          });
        }
      });
    });

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];

      const token: DB.Token = {
        out_point_tx_hash: cell.tx_hash,
        out_point_index: cell.index,
        block_number: blockNumber.toString(),
      };

      const r = toFactoryScriptAndTokenId(cell.output.type!.args);

      const factoryScript: DB.FactoryScript = {
        code_hash: r.factoryScript.code_hash,
        hash_type: r.factoryScript.hash_type,
        args: r.factoryScript.args,
      };

      const contract: DB.Contract = {
        code_hash: cell.output.type!.codeHash,
        hash_type: cell.output.type!.hashType,
      };

      await this.query.save(contract, factoryScript, token);
    }

    return true;
  }
}

export function toFactoryScriptAndTokenId(args: HexString): {
  factoryScript: Script;
  layer1TokenId: HexString;
} {
  const codeHash = args.slice(0, 66);
  const hashType = toHashType(+("0x" + args.slice(66, 68)));
  const scriptArgs = "0x" + args.slice(68, 132);
  const tokenId = "0x" + args.slice(132);

  return {
    factoryScript: {
      code_hash: codeHash,
      hash_type: hashType,
      args: scriptArgs,
    },
    layer1TokenId: tokenId,
  };
}

export function toHashType(num: number): HashType {
  if (num === 0) {
    return "data";
  } else if (num === 1) {
    return "type";
  } else if (num === 2) {
    return "data1";
  }
  throw new Error(`Error hash type ${num}`);
}
