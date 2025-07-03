import algosdk from 'algosdk';
import algorandConfig from '../config/algorand.js';

class ChipsTokenService {
  constructor() {
    this.assetId = null;
    this.creatorAccount = null;
    this.totalSupply = parseInt(process.env.CHIPS_TOTAL_SUPPLY) || 1000000000;
    this.decimals = parseInt(process.env.CHIPS_DECIMALS) || 6;
    this.unitName = process.env.CHIPS_UNIT_NAME || 'CHIPS';
    this.assetName = process.env.CHIPS_ASSET_NAME || 'Casino Chips Token';
    this.assetUrl = process.env.CHIPS_ASSET_URL || '';
    
    this.initializeCreator();
  }

  initializeCreator() {
    const creatorMnemonic = process.env.CHIPS_CREATOR_MNEMONIC;
    if (creatorMnemonic) {
      this.creatorAccount = algorandConfig.getAccount(creatorMnemonic);
    }
  }

  async createChipsToken() {
    if (!this.creatorAccount) {
      throw new Error('Creator account not initialized');
    }

    try {
      const params = await algorandConfig.getNetworkParams();
      
      const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: this.creatorAccount.addr,
        total: this.totalSupply * Math.pow(10, this.decimals),
        decimals: this.decimals,
        assetName: this.assetName,
        unitName: this.unitName,
        assetURL: this.assetUrl,
        assetMetadataHash: undefined,
        defaultFrozen: false,
        freeze: process.env.CHIPS_FREEZE_ADDRESS || this.creatorAccount.addr,
        manager: this.creatorAccount.addr,
        clawback: process.env.CHIPS_CLAWBACK_ADDRESS || this.creatorAccount.addr,
        reserve: this.creatorAccount.addr,
        suggestedParams: params,
      });

      const signedTxn = assetCreateTxn.signTxn(this.creatorAccount.sk);
      const txId = assetCreateTxn.txID().toString();
      
      await algorandConfig.algodClient.sendRawTransaction(signedTxn).do();
      const confirmedTxn = await algorandConfig.waitForConfirmation(txId);
      
      this.assetId = confirmedTxn['asset-index'];
      
      return {
        assetId: this.assetId,
        txId: txId,
        confirmedRound: confirmedTxn['confirmed-round']
      };
    } catch (error) {
      throw new Error(`Failed to create CHIPS token: ${error.message}`);
    }
  }

  async mintTokens(recipientAddress, amount) {
    if (!this.creatorAccount || !this.assetId) {
      throw new Error('Token not properly initialized');
    }

    try {
      const params = await algorandConfig.getNetworkParams();
      const mintAmount = amount * Math.pow(10, this.decimals);
      
      const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: this.creatorAccount.addr,
        to: recipientAddress,
        amount: mintAmount,
        assetIndex: this.assetId,
        suggestedParams: params,
      });

      const signedTxn = assetTransferTxn.signTxn(this.creatorAccount.sk);
      const txId = assetTransferTxn.txID().toString();
      
      await algorandConfig.algodClient.sendRawTransaction(signedTxn).do();
      const confirmedTxn = await algorandConfig.waitForConfirmation(txId);
      
      return {
        txId: txId,
        amount: amount,
        recipient: recipientAddress,
        confirmedRound: confirmedTxn['confirmed-round']
      };
    } catch (error) {
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }

  async transferTokens(fromMnemonic, toAddress, amount) {
    try {
      const fromAccount = algorandConfig.getAccount(fromMnemonic);
      const params = await algorandConfig.getNetworkParams();
      const transferAmount = amount * Math.pow(10, this.decimals);
      
      const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: fromAccount.addr,
        to: toAddress,
        amount: transferAmount,
        assetIndex: this.assetId,
        suggestedParams: params,
      });

      const signedTxn = assetTransferTxn.signTxn(fromAccount.sk);
      const txId = assetTransferTxn.txID().toString();
      
      await algorandConfig.algodClient.sendRawTransaction(signedTxn).do();
      const confirmedTxn = await algorandConfig.waitForConfirmation(txId);
      
      return {
        txId: txId,
        from: fromAccount.addr,
        to: toAddress,
        amount: amount,
        confirmedRound: confirmedTxn['confirmed-round']
      };
    } catch (error) {
      throw new Error(`Failed to transfer tokens: ${error.message}`);
    }
  }

  async optInToAsset(accountMnemonic) {
    try {
      const account = algorandConfig.getAccount(accountMnemonic);
      const params = await algorandConfig.getNetworkParams();
      
      const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: account.addr,
        to: account.addr,
        amount: 0,
        assetIndex: this.assetId,
        suggestedParams: params,
      });

      const signedTxn = optInTxn.signTxn(account.sk);
      const txId = optInTxn.txID().toString();
      
      await algorandConfig.algodClient.sendRawTransaction(signedTxn).do();
      const confirmedTxn = await algorandConfig.waitForConfirmation(txId);
      
      return {
        txId: txId,
        account: account.addr,
        confirmedRound: confirmedTxn['confirmed-round']
      };
    } catch (error) {
      throw new Error(`Failed to opt-in to asset: ${error.message}`);
    }
  }

  async getAssetBalance(address) {
    try {
      const accountInfo = await algorandConfig.algodClient.accountInformation(address).do();
      const asset = accountInfo.assets.find(a => a['asset-id'] === this.assetId);
      
      if (!asset) {
        return 0;
      }
      
      return asset.amount / Math.pow(10, this.decimals);
    } catch (error) {
      throw new Error(`Failed to get asset balance: ${error.message}`);
    }
  }

  setAssetId(assetId) {
    this.assetId = assetId;
  }
}

export default new ChipsTokenService();