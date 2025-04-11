import { Given, Then, When } from "@cucumber/cucumber";
import { accounts } from "../../src/config";
import {
  AccountBalanceQuery,
  AccountId,
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenId,
  TokenInfoQuery,
  TokenMintTransaction,
} from "@hashgraph/sdk";
import assert from "node:assert";

const client = Client.forTestnet();

const treasuryAccountId = accounts[0].id;
const treasuryKey = PrivateKey.fromStringED25519(accounts[0].privateKey);
const adminKey = PrivateKey.fromStringED25519(accounts[1].privateKey);
const supplyKey = PrivateKey.fromStringED25519(accounts[0].privateKey);

let tokenId: TokenId;

Given(
  /^A Hedera account with more than (\d+) hbar$/,
  async function (expectedBalance: number) {
    const account = accounts[0];
    const MY_ACCOUNT_ID = AccountId.fromString(account.id);
    const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(account.privateKey);
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    //Create the query request
    const query = new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID);
    const balance = await query.execute(client);
    assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance);
  }
);

When(/^I create a token named Test Token \(HTT\)$/, async function () {
  const transaction = await new TokenCreateTransaction()
    .setTokenName("Test Token")
    .setTokenSymbol("HTT")
    .setDecimals(2)
    .setTreasuryAccountId(treasuryAccountId)
    .setSupplyKey(supplyKey)
    .freezeWith(client);

  const signTx = await (await transaction.sign(adminKey)).sign(treasuryKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);

  receipt.tokenId && (tokenId = receipt.tokenId);
  console.log("The new token ID is " + tokenId);

  assert.ok(tokenId?.toString() !== undefined, "Token ID is not defined");
});

Then(/^The token has the name "([^"]*)"$/, async function (tokenName: string) {
  const query = new TokenInfoQuery().setTokenId(tokenId);
  const name = (await query.execute(client)).name;

  assert.ok(tokenName === name, `Token name is not ${tokenName}`);
});

Then(
  /^The token has the symbol "([^"]*)"$/,
  async function (tokenSymbol: string) {
    const query = new TokenInfoQuery().setTokenId(tokenId);
    const symbol = (await query.execute(client)).symbol;

    assert.ok(tokenSymbol === symbol, `Token symbol is not ${tokenSymbol}`);
  }
);

Then(/^The token has (\d+) decimals$/, async function (tokenDecimal: number) {
  const query = new TokenInfoQuery().setTokenId(tokenId);
  const decimal = (await query.execute(client)).decimals;

  assert.ok(tokenDecimal === decimal, `Token decimal is not ${tokenDecimal}`);
});

Then(/^The token is owned by the account$/, async function () {});

Then(
  /^An attempt to mint (\d+) additional tokens succeeds$/,
  async function (tokenSupply: number) {
    const transaction = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setAmount(tokenSupply)
      .freezeWith(client);

    const signTx = await transaction.sign(supplyKey);
    const txResponse = await signTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const transactionStatus = receipt.status;

    console.log(
      "The transaction consensus status " + transactionStatus.toString()
    );

    assert.ok(transactionStatus.toString() === "SUCCESS", "Transaction failed");
  }
);

When(
  /^I create a fixed supply token named Test Token \(HTT\) with (\d+) tokens$/,
  async function (totalSupply: number) {
    const transaction = await new TokenCreateTransaction()
      .setTokenName("Test Token")
      .setTokenSymbol("HTT")
      .setDecimals(2)
      .setInitialSupply(totalSupply)
      .setTreasuryAccountId(treasuryAccountId)
      .setSupplyKey(supplyKey)
      .freezeWith(client);

    const signTx = await (await transaction.sign(adminKey)).sign(treasuryKey);
    const txResponse = await signTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    receipt.tokenId && (tokenId = receipt.tokenId);
    console.log("The new token ID is " + tokenId);

    assert.ok(tokenId?.toString() !== undefined, "Token ID is not defined");
  }
);

Then(
  /^The total supply of the token is (\d+)$/,
  async function (totalSupply: number) {
    const query = new TokenInfoQuery().setTokenId(tokenId);
    const tokenSupply = (await query.execute(client)).totalSupply;

    assert.ok(
      totalSupply === tokenSupply.toNumber(),
      `Token decimal is not ${totalSupply}`
    );
  }
);
Then(/^An attempt to mint tokens fails$/, async function () {});

Given(
  /^A first hedera account with more than (\d+) hbar$/,
  async function (expectedBalance: number) {
    const acc = accounts[0];
    const account: AccountId = AccountId.fromString(acc.id);
    this.account = account;
    const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
    this.privKey = privKey;
    client.setOperator(this.account, privKey);

    //Create the query request
    const query = new AccountBalanceQuery().setAccountId(account);
    const balance = await query.execute(client);
    console.log(balance.hbars.toBigNumber().toNumber());
    assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance);
  }
);
Given(/^A second Hedera account$/, async function () {
  const acc = accounts[1];
  const account: AccountId = AccountId.fromString(acc.id);
  this.account = account;
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  this.privKey = privKey;
  client.setOperator(this.account, privKey);

  //Create the query request
  const query = new AccountBalanceQuery().setAccountId(account);
  const balance = await query.execute(client);
  console.log(balance.hbars.toBigNumber().toNumber());
});

Given(
  /^A token named Test Token \(HTT\) with (\d+) tokens$/,
  async function () {}
);
Given(/^The first account holds (\d+) HTT tokens$/, async function () {});
Given(/^The second account holds (\d+) HTT tokens$/, async function () {});
When(
  /^The first account creates a transaction to transfer (\d+) HTT tokens to the second account$/,
  async function () {}
);
When(/^The first account submits the transaction$/, async function () {});
When(
  /^The second account creates a transaction to transfer (\d+) HTT tokens to the first account$/,
  async function () {}
);
Then(
  /^The first account has paid for the transaction fee$/,
  async function () {}
);
Given(
  /^A first hedera account with more than (\d+) hbar and (\d+) HTT tokens$/,
  async function () {}
);
Given(
  /^A second Hedera account with (\d+) hbar and (\d+) HTT tokens$/,
  async function () {}
);
Given(
  /^A third Hedera account with (\d+) hbar and (\d+) HTT tokens$/,
  async function () {}
);
Given(
  /^A fourth Hedera account with (\d+) hbar and (\d+) HTT tokens$/,
  async function () {}
);
When(
  /^A transaction is created to transfer (\d+) HTT tokens out of the first and second account and (\d+) HTT tokens into the third account and (\d+) HTT tokens into the fourth account$/,
  async function () {}
);
Then(/^The third account holds (\d+) HTT tokens$/, async function () {});
Then(/^The fourth account holds (\d+) HTT tokens$/, async function () {});
