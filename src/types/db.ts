export namespace DB {
  export const CONTRACTS_TABLE_NAME = "contracts";
  export interface Contract {
    id?: string;
    code_hash: string;
    hash_type: string;
  }

  export const FACTORY_SCRIPTS_TABLE_NAME = "factory_scripts";
  export interface FactoryScript {
    id?: string;
    code_hash: string;
    hash_type: string;
    args: string;
  }

  export const TOKENS_TABLE_NAME = "tokens";
  export interface Token {
    id?: string;
    out_point_tx_hash: string;
    out_point_index: number;
    block_number: string;

    factory_script_id?: string;
    contract_id?: string;
  }

  export const FLAGS_TABLE_NAME = "flags";
  export interface Flag {
    id?: string;

    key: string;
    value: string;
  }
}
