<template>
  <div class="wallet-connect">
    <div v-if="!algorandStore.account" class="connect-section">
      <h2 class="text-2xl font-bold mb-4">Connect Your Wallet</h2>
      <div class="space-y-4">
        <button 
          @click="generateNewAccount"
          :disabled="algorandStore.loading"
          class="btn btn-primary w-full"
        >
          {{ algorandStore.loading ? 'Generating...' : 'Generate New Account' }}
        </button>
        
        <div class="divider">OR</div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">Import Account (Mnemonic)</span>
          </label>
          <textarea 
            v-model="importMnemonic"
            placeholder="Enter your 25-word mnemonic phrase"
            class="textarea textarea-bordered h-24"
          ></textarea>
          <button 
            @click="importAccount"
            :disabled="!importMnemonic || algorandStore.loading"
            class="btn btn-secondary mt-2"
          >
            Import Account
          </button>
        </div>
      </div>
    </div>

    <div v-else class="account-info">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Account Connected</h2>
          <div class="space-y-2">
            <p><strong>Address:</strong> {{ truncateAddress(algorandStore.account.address) }}</p>
            <p><strong>ALGO Balance:</strong> {{ algorandStore.balance.algo.toFixed(6) }} ALGO</p>
            <p><strong>CHIPS Balance:</strong> {{ algorandStore.balance.chips.toFixed(6) }} CHIPS</p>
          </div>
          
          <div class="card-actions justify-end mt-4">
            <button @click="refreshBalance" class="btn btn-sm btn-outline">
              Refresh
            </button>
            <button @click="disconnect" class="btn btn-sm btn-error">
              Disconnect
            </button>
          </div>
        </div>
      </div>

      <div v-if="!hasOptedIn" class="alert alert-warning mt-4">
        <div>
          <span>You need to opt-in to CHIPS token to receive and send tokens.</span>
          <button @click="optInToChips" class="btn btn-sm btn-warning ml-2">
            Opt-in to CHIPS
          </button>
        </div>
      </div>
    </div>

    <div v-if="algorandStore.error" class="alert alert-error mt-4">
      <div>
        <span>{{ algorandStore.error }}</span>
        <button @click="algorandStore.clearError" class="btn btn-sm btn-ghost ml-2">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAlgorandStore } from '../stores/algorand.js';

const algorandStore = useAlgorandStore();
const importMnemonic = ref('');

const hasOptedIn = computed(() => {
  return algorandStore.balance.chips >= 0;
});

const generateNewAccount = async () => {
  try {
    await algorandStore.generateAccount();
  } catch (error) {
    console.error('Failed to generate account:', error);
  }
};

const importAccount = () => {
  if (importMnemonic.value.trim()) {
    const words = importMnemonic.value.trim().split(/\s+/);
    if (words.length === 25) {
      algorandStore.account = {
        address: 'IMPORTED_ADDRESS', // This would be calculated from mnemonic
        mnemonic: importMnemonic.value.trim()
      };
      localStorage.setItem('algorand_account', JSON.stringify(algorandStore.account));
      algorandStore.refreshBalance();
    } else {
      algorandStore.error = 'Invalid mnemonic phrase. Must be 25 words.';
    }
  }
};

const optInToChips = async () => {
  try {
    await algorandStore.optInToChips();
  } catch (error) {
    console.error('Failed to opt-in to CHIPS:', error);
  }
};

const refreshBalance = () => {
  algorandStore.refreshBalance();
};

const disconnect = () => {
  algorandStore.account = null;
  algorandStore.balance = { algo: 0, chips: 0 };
  localStorage.removeItem('algorand_account');
};

const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

onMounted(() => {
  algorandStore.loadAccount();
});
</script>