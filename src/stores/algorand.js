import { defineStore } from 'pinia';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const useAlgorandStore = defineStore('algorand', {
  state: () => ({
    account: null,
    balance: {
      algo: 0,
      chips: 0
    },
    transactions: [],
    stakingInfo: null,
    loading: false,
    error: null
  }),

  actions: {
    async generateAccount() {
      try {
        this.loading = true;
        const response = await axios.post(`${API_BASE_URL}/account/generate`);
        
        if (response.data.success) {
          this.account = response.data.data;
          localStorage.setItem('algorand_account', JSON.stringify(this.account));
          return this.account;
        }
        throw new Error(response.data.error);
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async loadAccount() {
      const savedAccount = localStorage.getItem('algorand_account');
      if (savedAccount) {
        this.account = JSON.parse(savedAccount);
        await this.refreshBalance();
      }
    },

    async refreshBalance() {
      if (!this.account) return;

      try {
        this.loading = true;
        const response = await axios.get(`${API_BASE_URL}/balance/${this.account.address}`);
        
        if (response.data.success) {
          this.balance = {
            algo: response.data.data.algoBalance,
            chips: response.data.data.chipsBalance
          };
        }
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async optInToChips() {
      if (!this.account) throw new Error('No account loaded');

      try {
        this.loading = true;
        const response = await axios.post(`${API_BASE_URL}/token/opt-in`, {
          accountMnemonic: this.account.mnemonic
        });
        
        if (response.data.success) {
          await this.refreshBalance();
          return response.data.data;
        }
        throw new Error(response.data.error);
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async transferChips(toAddress, amount) {
      if (!this.account) throw new Error('No account loaded');

      try {
        this.loading = true;
        const response = await axios.post(`${API_BASE_URL}/token/transfer`, {
          fromMnemonic: this.account.mnemonic,
          toAddress: toAddress,
          amount: amount
        });
        
        if (response.data.success) {
          await this.refreshBalance();
          return response.data.data;
        }
        throw new Error(response.data.error);
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async stakeTokens(poolId, amount) {
      if (!this.account) throw new Error('No account loaded');

      try {
        this.loading = true;
        const response = await axios.post(`${API_BASE_URL}/staking/stake`, {
          poolId: poolId,
          userAddress: this.account.address,
          amount: amount,
          userMnemonic: this.account.mnemonic
        });
        
        if (response.data.success) {
          await this.refreshStakingInfo(poolId);
          return response.data.data;
        }
        throw new Error(response.data.error);
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async unstakeTokens(poolId, amount) {
      if (!this.account) throw new Error('No account loaded');

      try {
        this.loading = true;
        const response = await axios.post(`${API_BASE_URL}/staking/unstake`, {
          poolId: poolId,
          userAddress: this.account.address,
          amount: amount,
          userMnemonic: this.account.mnemonic
        });
        
        if (response.data.success) {
          await this.refreshStakingInfo(poolId);
          return response.data.data;
        }
        throw new Error(response.data.error);
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async claimRewards() {
      if (!this.account) throw new Error('No account loaded');

      try {
        this.loading = true;
        const response = await axios.post(`${API_BASE_URL}/staking/claim-rewards`, {
          userAddress: this.account.address,
          userMnemonic: this.account.mnemonic
        });
        
        if (response.data.success) {
          await this.refreshBalance();
          return response.data.data;
        }
        throw new Error(response.data.error);
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async refreshStakingInfo(poolId) {
      if (!this.account) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/staking/info/${poolId}/${this.account.address}`);
        
        if (response.data.success) {
          this.stakingInfo = response.data.data;
        }
      } catch (error) {
        this.error = error.message;
      }
    },

    async loadTransactionHistory() {
      if (!this.account) return;

      try {
        this.loading = true;
        const response = await axios.get(`${API_BASE_URL}/transactions/${this.account.address}`);
        
        if (response.data.success) {
          this.transactions = response.data.data.transactions;
        }
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    clearError() {
      this.error = null;
    }
  }
});