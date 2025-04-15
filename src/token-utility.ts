import {
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TransferTransaction,
  TokenId,
  TokenMintTransaction,
  AccountId,
  AccountInfoQuery,
  TokenAssociateTransaction,
} from "@hashgraph/sdk";
import { Account, accounts } from "./config";

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

interface TransferTokenParams {
  tokenId: TokenId;
  from: string;
  to: string;
  value: number;
  senderPrivateKey: PrivateKey;
  client: Client;
}

interface MintTokenParams {
  tokenId: TokenId;
  value: number;
  client: Client;
}

interface TokenBalanceParams {
  tokenId: TokenId;
  accountId: AccountId;
  client: Client;
}

interface TokenAssociationParams {
  accountId: AccountId;
  tokenId: TokenId;
  client: Client;
  accountKey: PrivateKey;
}

const createToken = async ({
  name = "Test Token",
  symbol = "HTT",
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

const mintToken = async ({ tokenId, value, client }: MintTokenParams) => {
  const transaction = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setAmount(value)
    .freezeWith(client);

  const signTx = await transaction.sign(supplyKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  const transactionStatus = receipt.status;

  console.log(
    "The transaction consensus status " + transactionStatus.toString()
  );

  return transactionStatus;
};

const transferToken = async ({
  tokenId,
  from,
  to,
  value,
  senderPrivateKey,
  client,
}: TransferTokenParams) => {
  const transaction = await new TransferTransaction()
    .addTokenTransfer(tokenId, from, value * -1) // Subtract from sender
    .addTokenTransfer(tokenId, to, value)
    .freezeWith(client);

  const signTx = await transaction.sign(senderPrivateKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);

  return receipt;
};

const tokenBalance = async ({
  tokenId,
  accountId,
  client,
}: TokenBalanceParams) => {
  const info = await new AccountInfoQuery()
    .setAccountId(accountId)
    .execute(client);

  const nftBalance =
    info.tokenRelationships.get(tokenId.toString())?.balance ?? 0;

  console.log(
    `🧾 NFT balance of token ${tokenId} for account ${accountId}: ${nftBalance}`
  );

  return nftBalance;
};

const tokenAssociation = async ({
  accountId,
  tokenId,
  client,
  accountKey,
}: TokenAssociationParams) => {
  const transaction = await new TokenAssociateTransaction()
    .setAccountId(accountId)
    .setTokenIds([tokenId])
    .freezeWith(client);
  const signTx = await transaction.sign(accountKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  const transactionStatus = receipt.status;

  console.log(
    "The transaction consensus status " + transactionStatus.toString()
  );

  return transactionStatus;
};

const isTokenAssociated = async ({
  accountId,
  tokenId,
  client,
}: {
  accountId: AccountId;
  tokenId: TokenId;
  client: Client;
}) => {
  const info = await new AccountInfoQuery()
    .setAccountId(accountId)
    .execute(client);

  const associated =
    info.tokenRelationships.get(tokenId.toString()) !== undefined;

  console.log(
    `🔎 Is token ${tokenId} associated with account ${accountId}?`,
    associated
  );
  return associated;
};

export {
  createToken,
  transferToken,
  mintToken,
  tokenBalance,
  tokenAssociation,
  isTokenAssociated,
};
