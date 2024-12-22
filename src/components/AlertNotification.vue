<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'success', // success, error, warning, info
  },
  duration: {
    type: Number,
    default: 3000
  }
});

const emit = defineEmits(['close']);
const isVisible = ref(true);

onMounted(() => {
  setTimeout(() => {
    isVisible.value = false;
    emit('close');
  }, props.duration);
});
</script>

<template>
  <Transition name="slide-fade">
    <div v-if="isVisible" :class="['alert', type]">
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
.alert {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  min-width: 300px;
  text-align: center;
}

.success {
  background-color: #38a169;
}

.error {
  background-color: #e53e3e;
}

.warning {
  background-color: #d69e2e;
}

.info {
  background-color: #3182ce;
}

/* Animation */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style> 