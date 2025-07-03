<template>
  <div class="token-transfer">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Transfer CHIPS Tokens</h2>
        
        <form @submit.prevent="transferTokens" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Recipient Address</span>
            </label>
            <input 
              v-model="recipientAddress"
              type="text"
              placeholder="Enter Algorand address"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Amount (CHIPS)</span>
            </label>
            <input 
              v-model.number="amount"
              type="number"
              step="0.000001"
              min="0"
              :max="algorandStore.balance.chips"
              placeholder="0.000000"
              class="input input-bordered"
              required
            />
            <label class="label">
              <span class="label-text-alt">
                Available: {{ algorandStore.balance.chips.toFixed(6) }} CHIPS
              </span>
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Note (Optional)</span>
            </label>
            <input 
              v-model="note"
              type="text"
              placeholder="Transaction note"
              class="input input-bordered"
              maxlength="1000"
            />
          </div>

          <div class="card-actions justify-end">
            <button 
              type="submit"
              :disabled="!canTransfer || algorandStore.loading"
              class="btn btn-primary"
            >
              {{ algorandStore.loading ? 'Transferring...' : 'Transfer Tokens' }}
            </button>
          </div>
        </form>

        <div v-if="lastTransaction" class="alert alert-success mt-4">
          <div>
            <span>Transfer successful!</span>
            <p class="text-sm mt-1">
              Transaction ID: {{ truncateString(lastTransaction.txId) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAlgorandStore } from '../stores/algorand.js';

const algorandStore = useAlgorandStore();

const recipientAddress = ref('');
const amount = ref(0);
const note = ref('');
const lastTransaction = ref(null);

const canTransfer = computed(() => {
  return algorandStore.account && 
         recipientAddress.value && 
         amount.value > 0 && 
         amount.value <= algorandStore.balance.chips &&
         recipientAddress.value.length === 58; // Algorand address length
});

const transferTokens = async () => {
  try {
    const result = await algorandStore.transferChips(
      recipientAddress.value,
      amount.value
    );
    
    lastTransaction.value = result;
    
    // Reset form
    recipientAddress.value = '';
    amount.value = 0;
    note.value = '';
    
    // Refresh balance
    await algorandStore.refreshBalance();
  } catch (error) {
    console.error('Transfer failed:', error);
  }
};

const truncateString = (str) => {
  if (!str) return '';
  return `${str.slice(0, 8)}...${str.slice(-8)}`;
};
</script>