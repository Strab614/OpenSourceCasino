import algosdk from 'algosdk';
import dotenv from 'dotenv';

dotenv.config();

class AlgorandConfig {
  constructor() {
    this.network = process.env.ALGORAND_NETWORK || 'testnet';
    this.nodeUrl = process.env.ALGORAND_NODE_URL;
    this.indexerUrl = process.env.ALGORAND_INDEXER_URL;
    this.nodeToken = process.env.ALGORAND_NODE_TOKEN || '';
    
    this.algodClient = new algosdk.Algodv2(this.nodeToken, this.nodeUrl, '');
    this.indexerClient = new algosdk.Indexer(this.nodeToken, this.indexerUrl, '');
  }

  async getNetworkParams() {
    try {
      const params = await this.algodClient.getTransactionParams().do();
      return params;
    } catch (error) {
      throw new Error(`Failed to get network parameters: ${error.message}`);
    }
  }

  async waitForConfirmation(txId, timeout = 10) {
    let lastRound = (await this.algodClient.status().do())['last-round'];
    
    while (true) {
      const pendingInfo = await this.algodClient.pendingTransactionInformation(txId).do();
      
      if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
        return pendingInfo;
      }
      
      if (pendingInfo['pool-error'] != null && pendingInfo['pool-error'].length > 0) {
        throw new Error(`Transaction rejected: ${pendingInfo['pool-error']}`);
      }
      
      await this.algodClient.statusAfterBlock(lastRound).do();
      lastRound++;
      
      if (lastRound > pendingInfo['last-valid'] + timeout) {
        throw new Error('Transaction confirmation timeout');
      }
    }
  }

  getAccount(mnemonic) {
    try {
      return algosdk.mnemonicToSecretKey(mnemonic);
    } catch (error) {
      throw new Error(`Invalid mnemonic: ${error.message}`);
    }
  }

  generateAccount() {
    const account = algosdk.generateAccount();
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
    return { account, mnemonic };
  }
}

export default new AlgorandConfig();