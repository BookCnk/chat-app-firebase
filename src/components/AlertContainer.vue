<script setup>
import AlertNotification from "./AlertNotification.vue";
import { useAlert } from "../lib/useAlert";

const { alerts, removeAlert } = useAlert();
</script>

<template>
  <div class="alert-container">
    <AlertNotification
      v-for="alert in alerts"
      :key="alert.id"
      :message="alert.message"
      :type="alert.type"
      :duration="alert.duration"
      @close="removeAlert(alert.id)" />
  </div>
</template>

<style scoped>
.alert-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}
</style>
