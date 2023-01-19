import { env } from "process";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export const Config = {
  ckbRPC: getOptional("CKB_RPC") || "https://mainnet.ckbapp.dev/rpc",
  tokenDataHeader: "0x0ddeff3e8ee03cbf6a2c6920d05c381e",
  databaseUrl: getRequired("DATABASE_URL"),
};

function getRequired(name: string): string {
  const value = env[name];
  if (value == null) {
    throw new Error(`no env ${name} provided`);
  }

  return value;
}

function getOptional(name: string): string | undefined {
  return env[name];
}
