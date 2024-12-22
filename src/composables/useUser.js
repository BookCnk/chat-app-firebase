import { ref } from 'vue';

const currentUser = ref(JSON.parse(localStorage.getItem('user')) || null);

export function useUser() {
  const setUser = (userData) => {
    currentUser.value = userData;
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const clearUser = () => {
    currentUser.value = null;
    localStorage.removeItem('user');
  };

  const getUser = () => {
    return currentUser.value;
  };

  return {
    currentUser,
    setUser,
    clearUser,
    getUser
  };
} 