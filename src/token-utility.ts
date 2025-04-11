import { Client, PrivateKey, TokenCreateTransaction } from "@hashgraph/sdk";
import { accounts } from "./config";

const treasuryAccountId = accounts[0].id;
const treasuryKey = PrivateKey.fromStringED25519(accounts[0].privateKey);
const adminKey = PrivateKey.fromStringED25519(accounts[1].privateKey);
const supplyKey = PrivateKey.fromStringED25519(accounts[0].privateKey);

interface CreateTokenParams {
  name?: string;
  symbol?: string;
  decimal?: number;
  totalSupply?: number;
  client: Client;
}

const createToken = async ({
  name = "DefaultToken",
  symbol = "DTK",
  decimal = 0,
  totalSupply = 1000,
  client,
}: CreateTokenParams) => {
  const transaction = await new TokenCreateTransaction()
    .setTokenName(name)
    .setTokenSymbol(symbol)
    .setDecimals(decimal)
    .setTreasuryAccountId(treasuryAccountId)
    .setSupplyKey(supplyKey)
    .setInitialSupply(totalSupply)
    .freezeWith(client);

  const signTx = await (await transaction.sign(adminKey)).sign(treasuryKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);

  return receipt;
};

export { createToken };
