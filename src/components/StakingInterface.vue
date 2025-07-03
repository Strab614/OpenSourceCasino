<template>
  <div class="staking-interface">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Staking Pool Info -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Staking Pool</h2>
          
          <div class="stats stats-vertical shadow">
            <div class="stat">
              <div class="stat-title">Your Staked Amount</div>
              <div class="stat-value text-primary">
                {{ stakingInfo?.userStake?.toFixed(6) || '0.000000' }} CHIPS
              </div>
            </div>
            
            <div class="stat">
              <div class="stat-title">Pending Rewards</div>
              <div class="stat-value text-secondary">
                {{ stakingInfo?.pendingRewards?.toFixed(6) || '0.000000' }} CHIPS
              </div>
            </div>
            
            <div class="stat">
              <div class="stat-title">Pool Total Staked</div>
              <div class="stat-value">
                {{ stakingInfo?.poolTotalStaked?.toFixed(6) || '0.000000' }} CHIPS
              </div>
            </div>
            
            <div class="stat">
              <div class="stat-title">Reward Rate</div>
              <div class="stat-value">
                {{ ((stakingInfo?.rewardRate || 0) * 100).toFixed(2) }}% APY
              </div>
            </div>
          </div>

          <div class="card-actions justify-end mt-4">
            <button 
              @click="refreshStakingInfo"
              :disabled="algorandStore.loading"
              class="btn btn-outline btn-sm"
            >
              Refresh
            </button>
            <button 
              @click="claimRewards"
              :disabled="!canClaimRewards || algorandStore.loading"
              class="btn btn-secondary btn-sm"
            >
              Claim Rewards
            </button>
          </div>
        </div>
      </div>

      <!-- Staking Actions -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Staking Actions</h2>
          
          <div class="tabs tabs-boxed">
            <a 
              class="tab"
              :class="{ 'tab-active': activeTab === 'stake' }"
              @click="activeTab = 'stake'"
            >
              Stake
            </a>
            <a 
              class="tab"
              :class="{ 'tab-active': activeTab === 'unstake' }"
              @click="activeTab = 'unstake'"
            >
              Unstake
            </a>
          </div>

          <!-- Stake Tab -->
          <div v-if="activeTab === 'stake'" class="space-y-4 mt-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Amount to Stake (CHIPS)</span>
              </label>
              <input 
                v-model.number="stakeAmount"
                type="number"
                step="0.000001"
                min="100"
                :max="algorandStore.balance.chips"
                placeholder="100.000000"
                class="input input-bordered"
              />
              <label class="label">
                <span class="label-text-alt">
                  Available: {{ algorandStore.balance.chips.toFixed(6) }} CHIPS
                </span>
                <span class="label-text-alt">
                  Minimum: 100 CHIPS
                </span>
              </label>
            </div>

            <button 
              @click="stakeTokens"
              :disabled="!canStake || algorandStore.loading"
              class="btn btn-primary w-full"
            >
              {{ algorandStore.loading ? 'Staking...' : 'Stake Tokens' }}
            </button>
          </div>

          <!-- Unstake Tab -->
          <div v-if="activeTab === 'unstake'" class="space-y-4 mt-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Amount to Unstake (CHIPS)</span>
              </label>
              <input 
                v-model.number="unstakeAmount"
                type="number"
                step="0.000001"
                min="0"
                :max="stakingInfo?.userStake || 0"
                placeholder="0.000000"
                class="input input-bordered"
              />
              <label class="label">
                <span class="label-text-alt">
                  Staked: {{ stakingInfo?.userStake?.toFixed(6) || '0.000000' }} CHIPS
                </span>
              </label>
            </div>

            <button 
              @click="unstakeTokens"
              :disabled="!canUnstake || algorandStore.loading"
              class="btn btn-warning w-full"
            >
              {{ algorandStore.loading ? 'Unstaking...' : 'Unstake Tokens' }}
            </button>
          </div>

          <div v-if="lastStakingTransaction" class="alert alert-success mt-4">
            <div>
              <span>{{ lastStakingTransaction.type }} successful!</span>
              <p class="text-sm mt-1">
                Transaction ID: {{ truncateString(lastStakingTransaction.txId) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAlgorandStore } from '../stores/algorand.js';

const algorandStore = useAlgorandStore();

const activeTab = ref('stake');
const stakeAmount = ref(100);
const unstakeAmount = ref(0);
const lastStakingTransaction = ref(null);
const poolId = 'main-pool'; // Default pool ID

const stakingInfo = computed(() => algorandStore.stakingInfo);

const canStake = computed(() => {
  return algorandStore.account && 
         stakeAmount.value >= 100 && 
         stakeAmount.value <= algorandStore.balance.chips;
});

const canUnstake = computed(() => {
  return algorandStore.account && 
         unstakeAmount.value > 0 && 
         unstakeAmount.value <= (stakingInfo.value?.userStake || 0);
});

const canClaimRewards = computed(() => {
  return algorandStore.account && 
         (stakingInfo.value?.pendingRewards || 0) > 0;
});

const stakeTokens = async () => {
  try {
    const result = await algorandStore.stakeTokens(poolId, stakeAmount.value);
    lastStakingTransaction.value = { ...result, type: 'Stake' };
    stakeAmount.value = 100;
  } catch (error) {
    console.error('Staking failed:', error);
  }
};

const unstakeTokens = async () => {
  try {
    const result = await algorandStore.unstakeTokens(poolId, unstakeAmount.value);
    lastStakingTransaction.value = { ...result, type: 'Unstake' };
    unstakeAmount.value = 0;
  } catch (error) {
    console.error('Unstaking failed:', error);
  }
};

const claimRewards = async () => {
  try {
    const result = await algorandStore.claimRewards();
    lastStakingTransaction.value = { ...result, type: 'Claim Rewards' };
  } catch (error) {
    console.error('Claiming rewards failed:', error);
  }
};

const refreshStakingInfo = () => {
  algorandStore.refreshStakingInfo(poolId);
};

const truncateString = (str) => {
  if (!str) return '';
  return `${str.slice(0, 8)}...${str.slice(-8)}`;
};

// Watch for account changes
watch(() => algorandStore.account, (newAccount) => {
  if (newAccount) {
    refreshStakingInfo();
  }
}, { immediate: true });

onMounted(() => {
  if (algorandStore.account) {
    refreshStakingInfo();
  }
});
</script>