<script setup>
import { ref } from "vue";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/init";
import { useAlert } from "../lib/useAlert";
import { useUser } from "../composables/useUser";
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref("");
const userName = ref("");
const isLoading = ref(false);
const { showAlert } = useAlert();
const { setUser } = useUser();

const handleLogin = async () => {
  userName.value = "";
  isLoading.value = true;

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.value));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = {
        id: userDoc.id,
        ...userDoc.data()
      };
      
      setUser(userData);
      
      showAlert({
        message: `ยินดีต้อนรับคุณ ${userData.name}`,
        type: "success"
      });

      router.push('/home');
    } else {
      showAlert({
        message: "ไม่พบอีเมลนี้ในระบบ",
        type: "error"
      });
    }
  } catch (error) {
    console.error("Error:", error);
    showAlert({
      message: "เกิดข้อผิดพลาด กรุณาลองใหม่",
      type: "error"
    });
  } finally {
    isLoading.value = false;
  }
};

const showNotification = (message) => {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
};
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>เข้าสู่ระบบ</h1>
        <p class="subtitle">ยินดีต้อนรับกลับมา</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label for="email">อีเมล</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="กรุณากรอกอีเมลของคุณ"
            required />
        </div>

        <button type="submit" :disabled="isLoading" class="login-button">
          <span v-if="isLoading" class="loader"></span>
          <span v-else>เข้าสู่ระบบ</span>
        </button>

        <p v-if="userName" class="success">ยินดีต้อนรับ {{ userName }}!</p>
        <button v-if="userName" class="go-home-button">
          <span>เข้าสู่หน้าหลัก</span>
        </button>
      </form>

      <div class="login-footer">
        <p>
          ยังไม่มีบัญชี?
          <router-link to="/signup" class="signup-link">ลงทะเบียน</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #2d3748;
  font-size: 2em;
  margin-bottom: 8px;
}

.go-home-button {
  padding: 6px 12px; 
  font-size: 12px; 
  font-weight: 600;
  color: #ffffff; 
  background-color: #42b883; 
  border: none; 
  border-radius: 20px; 
  cursor: pointer; 
  transition: all 0.3s ease; 
  text-transform: uppercase; 
  align-items: center;
  justify-content: center;
}

.go-home-button:hover {
  background-color: #2d995b; 
  transform: scale(1.05); 
}

.go-home-button:active {
  background-color: #267947; 
  transform: scale(0.95); 
}

.go-home-button span {
  display: inline-block;
  line-height: 1; 
}

.subtitle {
  color: #718096;
  font-size: 0.9em;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #4a5568;
  font-size: 0.9em;
}

input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
}

input:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.login-button {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.login-button:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.login-button:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  color: #e53e3e;
  margin-top: 12px;
  font-size: 0.9em;
  text-align: center;
}

.success {
  color: #38a169;
  margin-top: 12px;
  font-size: 0.9em;
  text-align: center;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  color: #718096;
  font-size: 0.9em;
}

.signup-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.signup-link:hover {
  text-decoration: underline;
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #38a169;
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
