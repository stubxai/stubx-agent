// Scanner fixture. Not imported. Not part of the agent.
// A clean src/ tree must not contain these spellings. This file must.
const { Keypair } = require("@solana/web3.js");

function unsafe(connection, tx) {
  const kp = Keypair.generate();
  kp.signTransaction(tx);
  connection.sendTransaction(tx);
  connection.sendRawTransaction(tx);
  kp.signMessage(Buffer.from("x"));
  kp.partialSign(tx);
  const secretKey = kp.secretKey;
  Keypair.fromSecretKey(secretKey);
  const seedPhrase = kp.seedPhrase;
  const spaced = "seed phrase";
  require("bs58").decode("example");
  const nacl = require("nacl");
  nacl.sign(Buffer.from("x"));
  return "api.mainnet-beta.solana.com";
}

module.exports = { unsafe };
