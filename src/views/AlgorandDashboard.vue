<template>
  <div class="algorand-dashboard min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold text-white mb-4">
          Algorand CHIPS Platform
        </h1>
        <p class="text-xl text-blue-200 max-w-2xl mx-auto">
          Experience the future of casino gaming with blockchain-powered CHIPS tokens on Algorand
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="card bg-white/10 backdrop-blur-lg border border-white/20">
          <div class="card-body text-center">
            <div class="text-4xl mb-4">⚡</div>
            <h3 class="text-xl font-bold text-white mb-2">Lightning Fast</h3>
            <p class="text-blue-200">Instant transactions with Algorand's 4.5 second finality</p>
          </div>
        </div>
        
        <div class="card bg-white/10 backdrop-blur-lg border border-white/20">
          <div class="card-body text-center">
            <div class="text-4xl mb-4">🔒</div>
            <h3 class="text-xl font-bold text-white mb-2">Secure & Scalable</h3>
            <p class="text-blue-200">Military-grade security with unlimited scalability</p>
          </div>
        </div>
        
        <div class="card bg-white/10 backdrop-blur-lg border border-white/20">
          <div class="card-body text-center">
            <div class="text-4xl mb-4">🌱</div>
            <h3 class="text-xl font-bold text-white mb-2">Carbon Negative</h3>
            <p class="text-blue-200">Environmentally sustainable blockchain technology</p>
          </div>
        </div>
      </div>

      <!-- Main Dashboard -->
      <div class="space-y-8">
        <!-- Wallet Connection -->
        <WalletConnect />

        <!-- Dashboard Tabs -->
        <div v-if="algorandStore.account" class="card bg-white/10 backdrop-blur-lg border border-white/20">
          <div class="card-body">
            <div class="tabs tabs-boxed bg-white/20 mb-6">
              <a 
                class="tab text-white"
                :class="{ 'tab-active bg-primary': activeTab === 'transfer' }"
                @click="activeTab = 'transfer'"
              >
                Transfer
              </a>
              <a 
                class="tab text-white"
                :class="{ 'tab-active bg-primary': activeTab === 'staking' }"
                @click="activeTab = 'staking'"
              >
                Staking
              </a>
              <a 
                class="tab text-white"
                :class="{ 'tab-active bg-primary': activeTab === 'history' }"
                @click="activeTab = 'history'"
              >
                History
              </a>
            </div>

            <div class="tab-content">
              <TokenTransfer v-if="activeTab === 'transfer'" />
              <StakingInterface v-if="activeTab === 'staking'" />
              <TransactionHistory v-if="activeTab === 'history'" />
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div v-if="algorandStore.account" class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="stat bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg">
            <div class="stat-title text-blue-200">ALGO Balance</div>
            <div class="stat-value text-white">{{ algorandStore.balance.algo.toFixed(6) }}</div>
            <div class="stat-desc text-blue-300">Algorand Native Token</div>
          </div>
          
          <div class="stat bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg">
            <div class="stat-title text-blue-200">CHIPS Balance</div>
            <div class="stat-value text-primary">{{ algorandStore.balance.chips.toFixed(6) }}</div>
            <div class="stat-desc text-blue-300">Casino Gaming Token</div>
          </div>
          
          <div class="stat bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg">
            <div class="stat-title text-blue-200">Staked Amount</div>
            <div class="stat-value text-secondary">{{ (algorandStore.stakingInfo?.userStake || 0).toFixed(6) }}</div>
            <div class="stat-desc text-blue-300">Earning Rewards</div>
          </div>
          
          <div class="stat bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg">
            <div class="stat-title text-blue-200">Pending Rewards</div>
            <div class="stat-value text-accent">{{ (algorandStore.stakingInfo?.pendingRewards || 0).toFixed(6) }}</div>
            <div class="stat-desc text-blue-300">Ready to Claim</div>
          </div>
        </div>

        <!-- Integration Guide -->
        <div class="card bg-white/10 backdrop-blur-lg border border-white/20">
          <div class="card-body">
            <h2 class="card-title text-white mb-4">Integration Guide</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold text-white mb-2">For Developers</h3>
                <ul class="space-y-2 text-blue-200">
                  <li>• Use Algorand SDK for seamless integration</li>
                  <li>• Implement ASA (Algorand Standard Assets) for tokens</li>
                  <li>• Leverage smart contracts for game logic</li>
                  <li>• Connect with popular wallets like Pera and Exodus</li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white mb-2">Key Features</h3>
                <ul class="space-y-2 text-blue-200">
                  <li>• Multi-signature security for large transactions</li>
                  <li>• Rate limiting and transaction validation</li>
                  <li>• Staking rewards and token distribution</li>
                  <li>• Real-time balance and transaction tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAlgorandStore } from '../stores/algorand.js';
import WalletConnect from '../components/WalletConnect.vue';
import TokenTransfer from '../components/TokenTransfer.vue';
import StakingInterface from '../components/StakingInterface.vue';
import TransactionHistory from '../components/TransactionHistory.vue';

const algorandStore = useAlgorandStore();
const activeTab = ref('transfer');

onMounted(() => {
  algorandStore.loadAccount();
});
</script>