<script setup>
import { RouterView } from "vue-router";
import NavBar from "./components/NavBar.vue";

if (localStorage.getItem("points") === null)
  localStorage.setItem("points", 1000000);
</script>

<script>
import Game from "@/Game";

const games = [
  new Game("Slots", "/slots.jpg", "Spin the slots and win!"),
  new Game("Roulette", "/roulette.jpg", "Spin the wheel and win!"),
  new Game("Blackjack", "/blackjack.jpg", "Beat the dealer and win!"),
  new Game("Algorand", "/algorand-logo.png", "Experience blockchain-powered gaming with CHIPS tokens!"),
];
export default {
  data() {
    return {
      points: Number(localStorage.getItem("points")),
      games: games,
    };
  },
  methods: {
    changePoints(x) {
      this.points += x;
      localStorage.setItem("points", this.points);
    },
  },
};
</script>

<template>
  <NavBar :points="points" />
  <RouterView
    class="h-full pb-10 pt-28"
    :games="games"
    @changePoints="changePoints"
    :points="points"
  />
</template>