<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc,
  serverTimestamp,
  where,
  or,
  and,
  updateDoc,
  doc 
} from 'firebase/firestore';
import { db } from '../firebase/init';
import { useUser } from '../composables/useUser';
import { useAlert } from '../lib/useAlert';

const router = useRouter();
const { currentUser, clearUser } = useUser();
const { showAlert } = useAlert();
const isSidebarOpen = ref(false);
const messages = ref([]);
const users = ref([]);
const friends = ref([]);
const newMessage = ref('');
const isLoading = ref(false);
const selectedChat = ref('public');
const chatMode = ref('public');
const onlineUsers = ref([]);
const friendRequests = ref([]);
const pendingRequests = ref([]);

// ดึงข้อมูลผู้ใช้และสถานะออนไลน์
onMounted(async () => {
  if (!currentUser.value) {
    router.push('/login');
    return;
  }

  // อัพเดทสถานะออนไลน์
  const userRef = doc(db, 'users', currentUser.value.id);
  await updateDoc(userRef, {
    isOnline: true
  });

  // ตั้งค่าเมื่อปิดแท็บ/เบราว์เซอร์
  window.addEventListener('beforeunload', async () => {
    await updateDoc(userRef, {
      isOnline: false
    });
  });

  // ดึงรายชื่อผู้ใช้และสถานะ
  const usersRef = collection(db, 'users');
  onSnapshot(usersRef, (snapshot) => {
    users.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    onlineUsers.value = users.value.filter(user => user.isOnline);
    console.log('Users:', users.value);
  });

  // ดึงรายการเพื่อน
  const friendsRef = collection(db, 'friends');
  const friendsQuery = query(
    friendsRef,
    and(
      or(
        where('from', '==', currentUser.value.id),
        where('to', '==', currentUser.value.id)
      ),
      where('status', '==', 'accepted')
    )
  );

  onSnapshot(friendsQuery, (snapshot) => {
    friends.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Friends:', friends.value);
  });

  loadPublicMessages();
  loadFriendRequests();
});

// รายชื่อเพื่อน
const friendsList = computed(() => {
  return users.value.filter(user => {
    return friends.value.some(friend => 
      ((friend.from === user.id || friend.to === user.id) &&
      (friend.from === currentUser.value.id || friend.to === currentUser.value.id) &&
      friend.status === 'accepted') &&
      user.id !== currentUser.value.id
    );
  });
});

// โหลดข้อความสาธารณะ
const loadPublicMessages = () => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('to', '==', 'public'),
    orderBy('timestamp', 'asc')
  );
  
  onSnapshot(q, (snapshot) => {
    messages.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  });
};

// โหลดข้อความส่วนตัว
const loadPrivateMessages = (friendId) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    and(
      or(
        and(
          where('from', '==', currentUser.value.id),
          where('to', '==', friendId)
        ),
        and(
          where('from', '==', friendId),
          where('to', '==', currentUser.value.id)
        )
      )
    ),
    orderBy('timestamp', 'asc')
  );

  onSnapshot(q, (snapshot) => {
    messages.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));

    // อัพเดทสถานะการอ่าน
    snapshot.docs.forEach(async (doc) => {
      const messageData = doc.data();
      if (messageData.to === currentUser.value.id && !messageData.isRead) {
        await updateDoc(doc.ref, {
          isRead: true
        });
      }
    });
  });
};

// ส่งข้อความ
const sendMessage = async () => {
  if (!newMessage.value.trim()) return;
  
  isLoading.value = true;
  try {
    const messagesRef = collection(db, 'messages');
    await addDoc(messagesRef, {
      from: currentUser.value.id,
      to: selectedChat.value,
      message: newMessage.value,
      timestamp: serverTimestamp(),
      isRead: false
    });
    
    newMessage.value = '';
  } catch (error) {
    console.error('Error sending message:', error);
    showAlert({
      message: 'ไม่สามารถส่งข้อความได้',
      type: 'error'
    });
  } finally {
    isLoading.value = false;
  }
};

// ออกจากระบบ
const handleLogout = async () => {
  const userRef = doc(db, 'users', currentUser.value.id);
  await updateDoc(userRef, {
    isOnline: false
  });
  clearUser();
  router.push('/login');
};

// เพิ่มฟังก์ชันดึงคำขอเป็นเพื่อน
const loadFriendRequests = () => {
  const friendsRef = collection(db, 'friends');
  const requestsQuery = query(
    friendsRef,
    where('to', '==', currentUser.value.id),
    where('status', '==', 'pending')
  );

  onSnapshot(requestsQuery, (snapshot) => {
    friendRequests.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  });
};

// เพิ่มฟังก์ชันส่งคำขอเป็นเพื่อน
const sendFriendRequest = async (toUserId) => {
  try {
    const friendsRef = collection(db, 'friends');
    await addDoc(friendsRef, {
      from: currentUser.value.id,
      to: toUserId,
      status: 'pending'
    });
    showAlert({
      message: 'ส่งคำขอเป็นเพื่อนสำเร็จ',
      type: 'success'
    });
  } catch (error) {
    console.error('Error:', error);
    showAlert({
      message: 'ไม่สามารถส่งคำขอได้',
      type: 'error'
    });
  }
};

// เพิ่มฟังก์ชันตอบรับ/ปฏิเสธคำขอ
const handleFriendRequest = async (requestId, status) => {
  try {
    const requestRef = doc(db, 'friends', requestId);
    await updateDoc(requestRef, { status });
    
    showAlert({
      message: status === 'accepted' ? 'ยอมรับคำขอเป็นเพื่อนแล้ว' : 'ปฏิเสธคำขอเป็นเพื่อนแล้ว',
      type: 'success'
    });
  } catch (error) {
    console.error('Error:', error);
    showAlert({
      message: 'ไม่สามารถดำเนินการได้',
      type: 'error'
    });
  }
};

// เพิ่มฟังก์ชัน getUserName หลังจาก handleFriendRequest
const getUserName = (userId) => {
  if (userId === 'public') return 'แชทสาธารณะ';
  if (userId === currentUser.value?.id) return 'คุณ';
  
  const user = users.value.find(u => u.id === userId);
  return user ? user.name : 'ไม่พบชื่อผู้ใช้';
};

// เพิ่มฟังก์ชัน isOwnMessage
const isOwnMessage = (message) => {
  return message.from === currentUser.value?.id;
};

// เพิ่มฟังก์ชัน formatTime
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

// เพิ่มฟังก์ชัน toggleSidebar
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// เพิ่มฟังก์ชันเปลี่ยนห้องแชท
const switchChat = (chatId) => {
  selectedChat.value = chatId;
  chatMode.value = chatId === 'public' ? 'public' : 'private';
  messages.value = [];
  
  if (chatId === 'public') {
    loadPublicMessages();
  } else {
    loadPrivateMessages(chatId);
  }
};
</script>

<template>
  <div class="home-container">
    <!-- Sidebar -->
    <div :class="['sidebar', { 'open': isSidebarOpen }]">
      <div class="sidebar-header">
        <img :src="currentUser?.avatar || '../assets/avatar-placeholder.png'" 
             alt="Profile" 
             class="profile-img" />
        <h3>{{ currentUser?.name }}</h3>
      </div>
      
      <nav class="sidebar-nav">
        <!-- เพิ่มปุ่มเพื่อน -->
        <button 
          class="nav-item friend-btn"
          @click="router.push('/friend')"
        >
          <span class="icon">👥</span>
          เพื่อน
          <span v-if="friendRequests.length" class="friend-badge">
            {{ friendRequests.length }}
          </span>
        </button>

        <!-- แชทสาธารณะ -->
        <button 
          class="nav-item"
          :class="{ 'active': selectedChat === 'public' }"
          @click="switchChat('public')"
        >
          <span class="icon">🌎</span>
          แชทสาธารณะ
        </button>

        <!-- รายชื่อเพื่อน -->
        <div class="friends-list">
          <h4>เพื่อน</h4>
          <div 
            v-for="friend in friendsList" 
            :key="friend.id"
            class="friend-item"
            :class="{ 'active': selectedChat === friend.id }"
            @click="switchChat(friend.id)"
          >
            <div class="friend-avatar">
              <img :src="friend.avatar || '../assets/avatar-placeholder.png'" alt="Avatar">
              <span v-if="friend.isOnline" class="online-status"></span>
            </div>
            <div class="friend-info">
              <span class="friend-name">{{ friend.name }}</span>
              <span class="friend-status">{{ friend.isOnline ? 'ออนไลน์' : 'ออฟไลน์' }}</span>
            </div>
          </div>
        </div>
      </nav>

      <button class="logout-button" @click="handleLogout">
        <span class="icon">🚪</span>
        ออกจากระบบ
      </button>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <button class="toggle-sidebar" @click="toggleSidebar">
        <span v-if="isSidebarOpen">✕</span>
        <span v-else>☰</span>
      </button>

      <!-- Chat Area -->
      <div class="chat-container">
        <div class="chat-header">
          <h2>
            {{ chatMode === 'public' ? 'แชทสาธารณะ' : `แชทกับ ${getUserName(selectedChat)}` }}
          </h2>
        </div>

        <div class="messages-container">
          <div v-for="message in messages" 
               :key="message.id" 
               :class="['message', { 'own-message': isOwnMessage(message) }]">
            <div class="message-content">
              <div class="message-header">
                <span class="message-username">
                  {{ isOwnMessage(message) ? 'คุณ' : getUserName(message.from) }}
                </span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <p class="message-text">{{ message.message }}</p>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <input
            type="text"
            v-model="newMessage"
            :placeholder="chatMode === 'public' ? 'พิมพ์ข้อความสาธารณะ...' : 'พิมพ์ข้อความส่วนตัว...'" 
            @keyup.enter="sendMessage"
          />
          <button 
            class="send-button" 
            @click="sendMessage"
            :disabled="isLoading || !newMessage.trim()"
          >
            <span v-if="isLoading" class="loader"></span>
            <span v-else>ส่ง</span>
          </button>
        </div>
      </div>
    </div>

    <!-- เพิ่มส่วนแสดงผู้ใช้ออนไลน์ -->
    <div class="online-users">
      <h4>ผู้ใช้ออนไลน์ ({{ onlineUsers.length }})</h4>
      <div class="user-list">
        <div v-for="user in onlineUsers" :key="user.uid" class="user-item">
          <span class="online-indicator"></span>
          {{ user.name }}
        </div>
      </div>
    </div>

    <!-- เพิ่มส่วนแสดงคำขอเป็นเพื่อนในแถบข้าง -->
    <div class="friend-requests" v-if="friendRequests.length > 0">
      <h4>คำขอเป็นเพื่อน ({{ friendRequests.length }})</h4>
      <div v-for="request in friendRequests" :key="request.id" class="request-item">
        <span>{{ getUserName(request.from) }}</span>
        <div class="request-actions">
          <button 
            @click="handleFriendRequest(request.id, 'accepted')"
            class="accept-btn"
          >
            ✓
          </button>
          <button 
            @click="handleFriendRequest(request.id, 'rejected')"
            class="reject-btn"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  height: 100vh;
}

/* Sidebar Styles */
.sidebar {
  width: 280px;
  background: #2c3e50;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

.sidebar.open {
  transform: translateX(0);
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    z-index: 1000;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.profile-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 20px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.3s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
}

.icon {
  margin-right: 8px;
  font-size: 1.2em;
}

.logout-button {
  margin-top: auto;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Main Content Styles */
.main-content {
  flex-grow: 1;
  background: #f8f9fa;
  position: relative;
}

.toggle-sidebar {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  padding: 8px 12px;
  background: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Chat Styles */
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  padding-left: 60px;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chat-header {
  padding: 20px;
  background: #ffffff;
  border-radius: 12px 12px 0 0;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 20px;
}

.chat-header h2 {
  color: #2c3e50;
  font-size: 1.5em;
  font-weight: 600;
}

.messages-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 20px;
}

.message {
  max-width: 70%;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 12px;
  position: relative;
}

.message.own-message {
  margin-left: auto;
  background-color: #4a7bff;
  color: white;
  border: 1px solid #3867e0;
}

.message:not(.own-message) {
  margin-right: auto;
  background-color: #f1f3f5;
  color: #2c3e50;
  border: 1px solid #dee2e6;
}

.message-content {
  position: relative;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 0.9em;
}

.message-username {
  font-weight: 600;
  color: inherit;
}

.message-time {
  margin-left: 8px;
  color: inherit;
  opacity: 0.7;
}

.message-text {
  line-height: 1.5;
  word-break: break-word;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 15px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.chat-input input {
  flex-grow: 1;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1em;
  color: #2c3e50;
}

.chat-input input:focus {
  border-color: #4a7bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(74, 123, 255, 0.1);
}

.send-button {
  padding: 12px 24px;
  background: #4a7bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.send-button:hover:not(:disabled) {
  background: #3867e0;
  transform: translateY(-1px);
}

.send-button:disabled {
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
}

/* เพิ่ม styles ใหม่ */
.friends-list {
  margin-top: 20px;
  padding: 0 10px;
}

.friends-list h4 {
  color: #94a3b8;
  font-size: 0.9em;
  margin-bottom: 12px;
  padding-left: 8px;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.friend-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.friend-item.active {
  background: rgba(74, 123, 255, 0.3);
}

.friend-avatar {
  position: relative;
  margin-right: 12px;
}

.friend-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.online-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #22c55e;
  border-radius: 50%;
  border: 2px solid #2c3e50;
}

.friend-info {
  display: flex;
  flex-direction: column;
}

.friend-name {
  color: #e2e8f0;
  font-weight: 500;
  font-size: 0.95em;
}

.friend-status {
  color: #94a3b8;
  font-size: 0.8em;
  margin-top: 2px;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
}

.message.own-message {
  margin-left: auto;
  background-color: #667eea;
  color: white;
}

.message:not(.own-message) {
  margin-right: auto;
  background-color: #f8f9fa;
}

.online-users {
  position: fixed;
  right: 20px;
  top: 20px;
  background: white;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 200px;
}

.user-list {
  margin-top: 10px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 5px 0;
}

.online-indicator {
  width: 8px;
  height: 8px;
  background: #4CAF50;
  border-radius: 50%;
  margin-right: 8px;
}

.friend-requests {
  margin-top: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.request-actions {
  display: flex;
  gap: 8px;
}

.accept-btn, .reject-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.accept-btn {
  background: #4CAF50;
  color: white;
}

.reject-btn {
  background: #f44336;
  color: white;
}

.online-status {
  width: 8px;
  height: 8px;
  background: #4CAF50;
  border-radius: 50%;
  margin-left: 8px;
}

/* เพิ่ม styles สำหรับปุ่มเพื่อน */
.friend-btn {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px;
  background: transparent;
  color: white;
  border: none;
  cursor: pointer;
  transition: background 0.3s;
  margin-bottom: 10px;
}

.friend-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.friend-badge {
  position: absolute;
  right: 12px;
  background: #e53e3e;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.8em;
  min-width: 20px;
  text-align: center;
}

.icon {
  margin-right: 8px;
  font-size: 1.2em;
}
</style>
