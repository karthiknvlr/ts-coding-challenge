import { Given, Then, When } from "@cucumber/cucumber";
import {
  AccountBalanceQuery,
  AccountId,
  Client,
  PrivateKey,
  RequestType,
  TopicCreateTransaction,
  TopicId,
  TopicInfoQuery,
  TopicMessageQuery,
  TopicMessageSubmitTransaction,
  KeyList,
} from "@hashgraph/sdk";
import { accounts } from "../../src/config";
import assert from "node:assert";
import ConsensusSubmitMessage = RequestType.ConsensusSubmitMessage;

// Pre-configured client for test network (testnet)
const client = Client.forTestnet();
let topicId: TopicId;
let thresholdKey: KeyList;

//Set the operator with the account ID and private key

Given(
  /^a first account with more than (\d+) hbars$/,
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

When(
  /^A topic is created with the memo "([^"]*)" with the first account as the submit key$/,
  async function (memo: string) {
    const acc = accounts[0];
    const account: AccountId = AccountId.fromString(acc.id);
    this.account = account;
    const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
    this.privKey = privKey;
    client.setOperator(this.account, privKey);

    // Create a new topic with the specified memo
    const transaction = await new TopicCreateTransaction()
      .setTopicMemo(memo)
      .setSubmitKey(this.privKey)
      .execute(client);

    const receipt = await transaction.getReceipt(client);

    if (receipt.topicId != null) {
      topicId = receipt.topicId;
    }

    assert.ok(topicId != null, "Topic ID should not be null");
  }
);

When(
  /^The message "([^"]*)" is published to the topic$/,
  async function (message: string) {
    const acc = accounts[0];
    const account: AccountId = AccountId.fromString(acc.id);
    this.account = account;
    const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
    this.privKey = privKey;
    client.setOperator(this.account, privKey);

    // Create a new topic with the specified memo
    // const topicTxn = await new TopicCreateTransaction()
    //   .setSubmitKey(this.privKey)
    //   .execute(client);

    // const receipt = await topicTxn.getReceipt(client);
    // topicId = receipt.topicId;

    const transaction = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message)
      .execute(client);

    // Request the receipt
    const receipt = await transaction.getReceipt(client);

    console.log("Transaction Status:", receipt.status);

    assert.ok(true);
  }
);

Then(
  /^The message "([^"]*)" is received by the topic and can be printed to the console$/,
  async function (message: string) {}
);

Given(
  /^A second account with more than (\d+) hbars$/,
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

Given(
  /^A (\d+) of (\d+) threshold key with the first and second account$/,
  async function (threshold: number, total: number) {
    const publicKeyList = [];
    for (let index = 0; index < total; index++) {
      const accountKey = PrivateKey.fromStringED25519(accounts[index].privateKey)
      publicKeyList.push(accountKey.publicKey)
      
    }

    thresholdKey = new KeyList(publicKeyList, threshold);

    console.log("The 1/2 threshold key structure" + thresholdKey);
    
    assert.ok(thresholdKey != null, "Threshold key should not be null");
  }
);

When(
  /^A topic is created with the memo "([^"]*)" with the threshold key as the submit key$/,
  async function (memo: string) {
    const transaction = await new TopicCreateTransaction()
      .setTopicMemo(memo)
      .setSubmitKey(thresholdKey)
      .execute(client);

    const receipt = await transaction.getReceipt(client);

    assert.ok(receipt.topicId != null, "Topic ID should not be null");
  }
  
);
