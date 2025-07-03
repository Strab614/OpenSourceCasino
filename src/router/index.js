import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import AlgorandDashboard from "../views/AlgorandDashboard.vue";

const router = createRouter({
  history: createWebHistory("/"),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/algorand",
      name: "algorand",
      component: AlgorandDashboard,
    },
    {
      path: "/slots",
      name: "slots",
      component: () => import("../views/SlotsView.vue"),
    },
    {
      path: "/roulette",
      name: "roulette",
      component: () => import("../views/RouletteView.vue"),
    },
    {
      path: "/blackjack",
      name: "blackjack",
      component: () => import("../views/BlackjackView.vue"),
    },
  ],
});

export default router;