import algosdk from 'algosdk';
import algorandConfig from '../config/algorand.js';

class StakingService {
  constructor() {
    this.stakingPools = new Map();
    this.stakingRewards = new Map();
    this.minStakeAmount = 100; // Minimum CHIPS to stake
    this.rewardRate = 0.05; // 5% annual reward rate
  }

  async createStakingPool(poolId, rewardRate = this.rewardRate) {
    try {
      const pool = {
        id: poolId,
        totalStaked: 0,
        rewardRate: rewardRate,
        participants: new Map(),
        createdAt: Date.now(),
        lastRewardCalculation: Date.now()
      };
      
      this.stakingPools.set(poolId, pool);
      return pool;
    } catch (error) {
      throw new Error(`Failed to create staking pool: ${error.message}`);
    }
  }

  async stakeTokens(poolId, userAddress, amount, userMnemonic) {
    try {
      const pool = this.stakingPools.get(poolId);
      if (!pool) {
        throw new Error('Staking pool not found');
      }

      if (amount < this.minStakeAmount) {
        throw new Error(`Minimum stake amount is ${this.minStakeAmount} CHIPS`);
      }

      // Create staking smart contract transaction
      const params = await algorandConfig.getNetworkParams();
      const userAccount = algorandConfig.getAccount(userMnemonic);
      
      // For simplicity, we'll use a note field to indicate staking
      const stakingNote = new Uint8Array(Buffer.from(`STAKE:${poolId}:${amount}`));
      
      const stakingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: userAccount.addr,
        to: userAccount.addr, // Self-transaction with note
        amount: 0,
        note: stakingNote,
        suggestedParams: params,
      });

      const signedTxn = stakingTxn.signTxn(userAccount.sk);
      const txId = stakingTxn.txID().toString();
      
      await algorandConfig.algodClient.sendRawTransaction(signedTxn).do();
      const confirmedTxn = await algorandConfig.waitForConfirmation(txId);

      // Update pool and user staking info
      const currentStake = pool.participants.get(userAddress) || {
        amount: 0,
        stakedAt: Date.now(),
        lastRewardClaim: Date.now()
      };

      currentStake.amount += amount;
      pool.participants.set(userAddress, currentStake);
      pool.totalStaked += amount;

      return {
        txId: txId,
        poolId: poolId,
        userAddress: userAddress,
        stakedAmount: amount,
        totalStaked: currentStake.amount,
        confirmedRound: confirmedTxn['confirmed-round']
      };
    } catch (error) {
      throw new Error(`Failed to stake tokens: ${error.message}`);
    }
  }

  async unstakeTokens(poolId, userAddress, amount, userMnemonic) {
    try {
      const pool = this.stakingPools.get(poolId);
      if (!pool) {
        throw new Error('Staking pool not found');
      }

      const userStake = pool.participants.get(userAddress);
      if (!userStake || userStake.amount < amount) {
        throw new Error('Insufficient staked amount');
      }

      // Calculate and distribute rewards before unstaking
      await this.calculateRewards(poolId, userAddress);

      const params = await algorandConfig.getNetworkParams();
      const userAccount = algorandConfig.getAccount(userMnemonic);
      
      const unstakingNote = new Uint8Array(Buffer.from(`UNSTAKE:${poolId}:${amount}`));
      
      const unstakingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: userAccount.addr,
        to: userAccount.addr,
        amount: 0,
        note: unstakingNote,
        suggestedParams: params,
      });

      const signedTxn = unstakingTxn.signTxn(userAccount.sk);
      const txId = unstakingTxn.txID().toString();
      
      await algorandConfig.algodClient.sendRawTransaction(signedTxn).do();
      const confirmedTxn = await algorandConfig.waitForConfirmation(txId);

      // Update staking records
      userStake.amount -= amount;
      pool.totalStaked -= amount;

      if (userStake.amount === 0) {
        pool.participants.delete(userAddress);
      }

      return {
        txId: txId,
        poolId: poolId,
        userAddress: userAddress,
        unstakedAmount: amount,
        remainingStaked: userStake.amount,
        confirmedRound: confirmedTxn['confirmed-round']
      };
    } catch (error) {
      throw new Error(`Failed to unstake tokens: ${error.message}`);
    }
  }

  async calculateRewards(poolId, userAddress) {
    try {
      const pool = this.stakingPools.get(poolId);
      if (!pool) {
        throw new Error('Staking pool not found');
      }

      const userStake = pool.participants.get(userAddress);
      if (!userStake) {
        return 0;
      }

      const now = Date.now();
      const timeDiff = now - userStake.lastRewardClaim;
      const daysStaked = timeDiff / (1000 * 60 * 60 * 24);
      
      const annualReward = userStake.amount * pool.rewardRate;
      const dailyReward = annualReward / 365;
      const totalReward = dailyReward * daysStaked;

      // Update last reward claim time
      userStake.lastRewardClaim = now;

      // Store reward for later distribution
      const currentRewards = this.stakingRewards.get(userAddress) || 0;
      this.stakingRewards.set(userAddress, currentRewards + totalReward);

      return totalReward;
    } catch (error) {
      throw new Error(`Failed to calculate rewards: ${error.message}`);
    }
  }

  async claimRewards(userAddress, userMnemonic) {
    try {
      const pendingRewards = this.stakingRewards.get(userAddress) || 0;
      
      if (pendingRewards === 0) {
        throw new Error('No rewards to claim');
      }

      // In a real implementation, this would mint new tokens or transfer from a reward pool
      // For now, we'll just record the claim
      const params = await algorandConfig.getNetworkParams();
      const userAccount = algorandConfig.getAccount(userMnemonic);
      
      const claimNote = new Uint8Array(Buffer.from(`CLAIM_REWARDS:${pendingRewards}`));
      
      const claimTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: userAccount.addr,
        to: userAccount.addr,
        amount: 0,
        note: claimNote,
        suggestedParams: params,
      });

      const signedTxn = claimTxn.signTxn(userAccount.sk);
      const txId = claimTxn.txID().toString();
      
      await algorandConfig.algodClient.sendRawTransaction(signedTxn).do();
      const confirmedTxn = await algorandConfig.waitForConfirmation(txId);

      // Clear claimed rewards
      this.stakingRewards.set(userAddress, 0);

      return {
        txId: txId,
        userAddress: userAddress,
        rewardsClaimed: pendingRewards,
        confirmedRound: confirmedTxn['confirmed-round']
      };
    } catch (error) {
      throw new Error(`Failed to claim rewards: ${error.message}`);
    }
  }

  getStakingInfo(poolId, userAddress) {
    const pool = this.stakingPools.get(poolId);
    if (!pool) {
      return null;
    }

    const userStake = pool.participants.get(userAddress);
    const pendingRewards = this.stakingRewards.get(userAddress) || 0;

    return {
      poolId: poolId,
      userStake: userStake ? userStake.amount : 0,
      pendingRewards: pendingRewards,
      poolTotalStaked: pool.totalStaked,
      rewardRate: pool.rewardRate,
      stakedAt: userStake ? userStake.stakedAt : null
    };
  }
}

export default new StakingService();