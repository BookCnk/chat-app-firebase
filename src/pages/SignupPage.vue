<script setup>
import { ref } from "vue";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/init";
import { useRouter } from "vue-router";
import { useAlert } from "../lib/useAlert";

const router = useRouter();
const { showAlert } = useAlert();
const email = ref("");
const name = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

const handleSignup = async () => {
  errorMessage.value = "";
  isLoading.value = true;

  try {
    const usersRef = collection(db, "users");
    await addDoc(usersRef, {
      email: email.value,
      name: name.value,
      friends: [],
    });

    showAlert({
      message: "ลงทะเบียนสำเร็จ",
      type: "success",
    });
    router.push("/login");
  } catch (error) {
    console.error("Error:", error);
    showAlert({
      message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
      type: "error",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="signup-page">
    <div class="signup-container">
      <div class="signup-header">
        <h1>ลงทะเบียน</h1>
        <p class="subtitle">สร้างบัญชีใหม่</p>
      </div>

      <form @submit.prevent="handleSignup" class="signup-form">
        <div class="input-group">
          <label for="name">ชื่อ</label>
          <input
            id="name"
            type="text"
            v-model="name"
            placeholder="กรุณากรอกชื่อของคุณ"
            required />
        </div>

        <div class="input-group">
          <label for="email">อีเมล</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="กรุณากรอกอีเมลของคุณ"
            required />
        </div>

        <button type="submit" :disabled="isLoading" class="signup-button">
          <span v-if="isLoading" class="loader"></span>
          <span v-else>ลงทะเบียน</span>
        </button>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </form>

      <div class="signup-footer">
        <p>
          มีบัญชีอยู่แล้ว?
          <router-link to="/login" class="login-link">เข้าสู่ระบบ</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.signup-container {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.signup-header {
  text-align: center;
  margin-bottom: 30px;
}

.signup-header h1 {
  color: #2d3748;
  font-size: 2em;
  margin-bottom: 8px;
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

.signup-button {
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

.signup-button:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.signup-button:disabled {
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

.signup-footer {
  text-align: center;
  margin-top: 24px;
  color: #718096;
  font-size: 0.9em;
}

.login-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link:hover {
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
