import { ref } from 'vue';

const alerts = ref([]);
let alertId = 0;

export function useAlert() {
  const showAlert = ({ message, type = 'success', duration = 3000 }) => {
    const id = alertId++;
    alerts.value.push({ id, message, type, duration });
    
    setTimeout(() => {
      removeAlert(id);
    }, duration);
  };

  const removeAlert = (id) => {
    const index = alerts.value.findIndex(alert => alert.id === id);
    if (index !== -1) {
      alerts.value.splice(index, 1);
    }
  };

  return {
    alerts,
    showAlert,
    removeAlert
  };
} 