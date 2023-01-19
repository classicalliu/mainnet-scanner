export type HexNumber = string;
export type HexString = string;

export type HashType = "data" | "type" | "data1";

export interface Script {
  code_hash: HexString;
  hash_type: HashType;
  args: HexString;
}

export interface OutPoint {
  tx_hash: HexString;
  index: HexNumber;
}

export interface Output {
  capacity: HexString;
  lock: Script;
  type?: Script;
}
