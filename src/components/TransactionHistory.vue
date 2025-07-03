<template>
  <div class="transaction-history">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title">Transaction History</h2>
          <button 
            @click="loadTransactions"
            :disabled="algorandStore.loading"
            class="btn btn-outline btn-sm"
          >
            {{ algorandStore.loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>

        <div v-if="algorandStore.transactions.length === 0" class="text-center py-8">
          <p class="text-gray-500">No transactions found</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>From/To</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in displayTransactions" :key="tx.id">
                <td>
                  <div class="badge" :class="getTypeClass(tx)">
                    {{ getTransactionType(tx) }}
                  </div>
                </td>
                <td>
                  <span v-if="tx['asset-transfer-transaction']">
                    {{ formatAmount(tx['asset-transfer-transaction'].amount) }} CHIPS
                  </span>
                  <span v-else-if="tx['payment-transaction']">
                    {{ formatAlgoAmount(tx['payment-transaction'].amount) }} ALGO
                  </span>
                  <span v-else>-</span>
                </td>
                <td>
                  <div class="text-sm">
                    <div v-if="isIncoming(tx)">
                      <span class="text-green-600">From:</span>
                      {{ truncateAddress(tx.sender) }}
                    </div>
                    <div v-else>
                      <span class="text-red-600">To:</span>
                      {{ truncateAddress(getRecipient(tx)) }}
                    </div>
                  </div>
                </td>
                <td>
                  <div class="text-sm">
                    {{ formatDate(tx['round-time']) }}
                  </div>
                </td>
                <td>
                  <div class="badge badge-success">Confirmed</div>
                </td>
                <td>
                  <button 
                    @click="viewTransaction(tx.id)"
                    class="btn btn-ghost btn-xs"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="algorandStore.transactions.length > 10" class="flex justify-center mt-4">
          <div class="btn-group">
            <button 
              class="btn btn-sm"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              Previous
            </button>
            <button class="btn btn-sm btn-active">
              Page {{ currentPage }}
            </button>
            <button 
              class="btn btn-sm"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction Detail Modal -->
    <div v-if="selectedTransaction" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Transaction Details</h3>
        <div class="py-4 space-y-2">
          <p><strong>ID:</strong> {{ selectedTransaction.id }}</p>
          <p><strong>Round:</strong> {{ selectedTransaction['confirmed-round'] }}</p>
          <p><strong>Fee:</strong> {{ formatAlgoAmount(selectedTransaction.fee) }} ALGO</p>
          <p><strong>Sender:</strong> {{ selectedTransaction.sender }}</p>
          <div v-if="selectedTransaction.note">
            <strong>Note:</strong> {{ decodeNote(selectedTransaction.note) }}
          </div>
        </div>
        <div class="modal-action">
          <button @click="selectedTransaction = null" class="btn">Close</button>
          <a 
            :href="getExplorerUrl(selectedTransaction.id)"
            target="_blank"
            class="btn btn-primary"
          >
            View on Explorer
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAlgorandStore } from '../stores/algorand.js';

const algorandStore = useAlgorandStore();

const currentPage = ref(1);
const pageSize = 10;
const selectedTransaction = ref(null);

const totalPages = computed(() => {
  return Math.ceil(algorandStore.transactions.length / pageSize);
});

const displayTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return algorandStore.transactions.slice(start, end);
});

const loadTransactions = () => {
  algorandStore.loadTransactionHistory();
};

const getTransactionType = (tx) => {
  if (tx['asset-transfer-transaction']) {
    return 'Asset Transfer';
  } else if (tx['payment-transaction']) {
    return 'Payment';
  } else if (tx['asset-config-transaction']) {
    return 'Asset Config';
  }
  return 'Unknown';
};

const getTypeClass = (tx) => {
  if (tx['asset-transfer-transaction']) {
    return 'badge-primary';
  } else if (tx['payment-transaction']) {
    return 'badge-secondary';
  }
  return 'badge-neutral';
};

const isIncoming = (tx) => {
  if (!algorandStore.account) return false;
  
  if (tx['asset-transfer-transaction']) {
    return tx['asset-transfer-transaction'].receiver === algorandStore.account.address;
  } else if (tx['payment-transaction']) {
    return tx['payment-transaction'].receiver === algorandStore.account.address;
  }
  return false;
};

const getRecipient = (tx) => {
  if (tx['asset-transfer-transaction']) {
    return tx['asset-transfer-transaction'].receiver;
  } else if (tx['payment-transaction']) {
    return tx['payment-transaction'].receiver;
  }
  return '';
};

const formatAmount = (amount) => {
  return (amount / 1000000).toFixed(6); // Assuming 6 decimals for CHIPS
};

const formatAlgoAmount = (amount) => {
  return (amount / 1000000).toFixed(6); // Convert microAlgos to Algos
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleString();
};

const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

const decodeNote = (note) => {
  if (!note) return '';
  try {
    return atob(note);
  } catch {
    return 'Unable to decode note';
  }
};

const viewTransaction = (txId) => {
  selectedTransaction.value = algorandStore.transactions.find(tx => tx.id === txId);
};

const getExplorerUrl = (txId) => {
  const network = 'testnet'; // This should come from config
  return `https://${network}.algoexplorer.io/tx/${txId}`;
};

onMounted(() => {
  if (algorandStore.account) {
    loadTransactions();
  }
});
</script>