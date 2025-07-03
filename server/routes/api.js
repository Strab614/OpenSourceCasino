import express from 'express';
import rateLimit from 'express-rate-limit';
import chipsTokenService from '../services/ChipsTokenService.js';
import stakingService from '../services/StakingService.js';
import securityService from '../services/SecurityService.js';
import algorandConfig from '../config/algorand.js';

const router = express.Router();

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT) || 100,
  message: 'Too many requests from this IP'
});

router.use(apiLimiter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Token Management Endpoints
router.post('/token/create', async (req, res) => {
  try {
    const result = await chipsTokenService.createChipsToken();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/token/mint', async (req, res) => {
  try {
    const { recipientAddress, amount } = req.body;
    
    if (!recipientAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    const result = await chipsTokenService.mintTokens(recipientAddress, amount);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/token/transfer', async (req, res) => {
  try {
    const { fromMnemonic, toAddress, amount } = req.body;
    
    if (!fromMnemonic || !toAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    const result = await chipsTokenService.transferTokens(fromMnemonic, toAddress, amount);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/token/opt-in', async (req, res) => {
  try {
    const { accountMnemonic } = req.body;
    
    if (!accountMnemonic) {
      return res.status(400).json({
        success: false,
        error: 'Missing account mnemonic'
      });
    }
    
    const result = await chipsTokenService.optInToAsset(accountMnemonic);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Balance and Account Information
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address parameter required'
      });
    }
    
    const balance = await chipsTokenService.getAssetBalance(address);
    const accountInfo = await algorandConfig.algodClient.accountInformation(address).do();
    
    res.json({
      success: true,
      data: {
        address: address,
        chipsBalance: balance,
        algoBalance: accountInfo.amount / 1000000, // Convert microAlgos to Algos
        assets: accountInfo.assets
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Transaction History
router.get('/transactions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 10 } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address parameter required'
      });
    }
    
    const transactions = await algorandConfig.indexerClient
      .lookupAccountTransactions(address)
      .limit(parseInt(limit))
      .do();
    
    res.json({
      success: true,
      data: {
        address: address,
        transactions: transactions.transactions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Staking Endpoints
router.post('/staking/create-pool', async (req, res) => {
  try {
    const { poolId, rewardRate } = req.body;
    
    if (!poolId) {
      return res.status(400).json({
        success: false,
        error: 'Pool ID required'
      });
    }
    
    const result = await stakingService.createStakingPool(poolId, rewardRate);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/staking/stake', async (req, res) => {
  try {
    const { poolId, userAddress, amount, userMnemonic } = req.body;
    
    if (!poolId || !userAddress || !amount || !userMnemonic) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    const result = await stakingService.stakeTokens(poolId, userAddress, amount, userMnemonic);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/staking/unstake', async (req, res) => {
  try {
    const { poolId, userAddress, amount, userMnemonic } = req.body;
    
    if (!poolId || !userAddress || !amount || !userMnemonic) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    const result = await stakingService.unstakeTokens(poolId, userAddress, amount, userMnemonic);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/staking/claim-rewards', async (req, res) => {
  try {
    const { userAddress, userMnemonic } = req.body;
    
    if (!userAddress || !userMnemonic) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    const result = await stakingService.claimRewards(userAddress, userMnemonic);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/staking/info/:poolId/:userAddress', async (req, res) => {
  try {
    const { poolId, userAddress } = req.params;
    
    const stakingInfo = stakingService.getStakingInfo(poolId, userAddress);
    
    if (!stakingInfo) {
      return res.status(404).json({
        success: false,
        error: 'Staking pool not found'
      });
    }
    
    res.json({
      success: true,
      data: stakingInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Security Endpoints
router.post('/security/create-multisig', async (req, res) => {
  try {
    const { addresses, threshold } = req.body;
    
    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({
        success: false,
        error: 'Addresses array required'
      });
    }
    
    const result = securityService.createMultisigAccount(addresses, threshold);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Utility Endpoints
router.post('/account/generate', (req, res) => {
  try {
    const result = algorandConfig.generateAccount();
    res.json({
      success: true,
      data: {
        address: result.account.addr,
        mnemonic: result.mnemonic
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/network/status', async (req, res) => {
  try {
    const status = await algorandConfig.algodClient.status().do();
    const params = await algorandConfig.getNetworkParams();
    
    res.json({
      success: true,
      data: {
        network: algorandConfig.network,
        status: status,
        params: params
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;