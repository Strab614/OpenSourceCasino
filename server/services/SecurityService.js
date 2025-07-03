import algosdk from 'algosdk';
import algorandConfig from '../config/algorand.js';

class SecurityService {
  constructor() {
    this.multisigThreshold = parseInt(process.env.MULTISIG_THRESHOLD) || 2;
    this.transactionLimits = new Map();
    this.rateLimits = new Map();
  }

  createMultisigAccount(addresses, threshold = this.multisigThreshold) {
    try {
      const multisigParams = {
        version: 1,
        threshold: threshold,
        addrs: addresses
      };
      
      const multisigAddr = algosdk.multisigAddress(multisigParams);
      
      return {
        address: multisigAddr,
        params: multisigParams
      };
    } catch (error) {
      throw new Error(`Failed to create multisig account: ${error.message}`);
    }
  }

  async createMultisigTransaction(multisigParams, txnParams) {
    try {
      const params = await algorandConfig.getNetworkParams();
      
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        ...txnParams,
        suggestedParams: params
      });

      return {
        transaction: txn,
        multisigParams: multisigParams,
        txId: txn.txID().toString()
      };
    } catch (error) {
      throw new Error(`Failed to create multisig transaction: ${error.message}`);
    }
  }

  signMultisigTransaction(transaction, multisigParams, signerMnemonic) {
    try {
      const signerAccount = algorandConfig.getAccount(signerMnemonic);
      const signedTxn = algosdk.signMultisigTransaction(transaction, multisigParams, signerAccount.sk);
      
      return signedTxn;
    } catch (error) {
      throw new Error(`Failed to sign multisig transaction: ${error.message}`);
    }
  }

  async submitMultisigTransaction(signedTxns) {
    try {
      const combinedSignedTxn = algosdk.mergeMultisigTransactions(signedTxns);
      const txId = combinedSignedTxn.txID;
      
      await algorandConfig.algodClient.sendRawTransaction(combinedSignedTxn.blob).do();
      const confirmedTxn = await algorandConfig.waitForConfirmation(txId);
      
      return {
        txId: txId,
        confirmedRound: confirmedTxn['confirmed-round']
      };
    } catch (error) {
      throw new Error(`Failed to submit multisig transaction: ${error.message}`);
    }
  }

  validateTransaction(transaction, expectedParams) {
    try {
      // Verify transaction parameters
      if (transaction.from !== expectedParams.from) {
        throw new Error('Invalid sender address');
      }
      
      if (transaction.to !== expectedParams.to) {
        throw new Error('Invalid recipient address');
      }
      
      if (transaction.amount > expectedParams.maxAmount) {
        throw new Error('Amount exceeds maximum allowed');
      }
      
      // Check rate limits
      const rateLimitKey = `${transaction.from}:${Date.now()}`;
      const currentLimits = this.rateLimits.get(transaction.from) || [];
      const recentTransactions = currentLimits.filter(
        timestamp => Date.now() - timestamp < 60000 // 1 minute window
      );
      
      if (recentTransactions.length >= 10) { // Max 10 transactions per minute
        throw new Error('Rate limit exceeded');
      }
      
      // Update rate limits
      recentTransactions.push(Date.now());
      this.rateLimits.set(transaction.from, recentTransactions);
      
      return true;
    } catch (error) {
      throw new Error(`Transaction validation failed: ${error.message}`);
    }
  }

  generateSecureNote(data) {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    const noteData = {
      ...data,
      timestamp,
      nonce
    };
    
    return new Uint8Array(Buffer.from(JSON.stringify(noteData)));
  }

  verifyTransactionIntegrity(transaction, expectedNote) {
    try {
      if (!transaction.note) {
        throw new Error('Transaction missing required note');
      }
      
      const noteString = Buffer.from(transaction.note).toString();
      const noteData = JSON.parse(noteString);
      
      // Verify timestamp is recent (within 5 minutes)
      const timeDiff = Date.now() - noteData.timestamp;
      if (timeDiff > 300000) {
        throw new Error('Transaction timestamp too old');
      }
      
      // Verify expected data
      if (expectedNote && noteData.type !== expectedNote.type) {
        throw new Error('Transaction note type mismatch');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Transaction integrity verification failed: ${error.message}`);
    }
  }
}

export default new SecurityService();