<script setup>
import { ref, onMounted, computed } from "vue";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  and,
  or,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/init";
import { useUser } from "../composables/useUser";
import { useAlert } from "../lib/useAlert";
import { useRouter } from "vue-router";

const router = useRouter();
const { currentUser } = useUser();
const { showAlert } = useAlert();

const users = ref([]);
const friendRequests = ref([]);
const friends = ref([]);
const searchTerm = ref("");
const isLoading = ref(false);

// ดึงข้อมูลผู้ใช้ทั้งหมด
onMounted(() => {
  if (!currentUser.value) {
    router.push("/login");
    return;
  }

  // ดึงรายชื่อผู้ใช้ทั้งหมด (ยกเว้นตัวเอง)
  const usersRef = collection(db, "users");
  onSnapshot(usersRef, (snapshot) => {
    users.value = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((user) => user.id !== currentUser.value.id);
  });

  // ดึงคำขอเป็นเพื่อน
  loadFriendRequests();

  // ดึงรายชื่อเพื่อน
  loadFriends();
});

// โหลดคำขอเป็นเพื่อน
const loadFriendRequests = () => {
  const friendsRef = collection(db, "friends");
  const requestsQuery = query(
    friendsRef,
    where("to", "==", currentUser.value.id),
    where("status", "==", "pending")
  );

  onSnapshot(requestsQuery, (snapshot) => {
    friendRequests.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  });
};

// โหลดรายชื่อเพื่อน
const loadFriends = () => {
  const friendsRef = collection(db, "friends");
  const friendsQuery = query(
    friendsRef,
    and(
      or(
        where("from", "==", currentUser.value.id),
        where("to", "==", currentUser.value.id)
      ),
      where("status", "==", "accepted")
    )
  );

  onSnapshot(friendsQuery, (snapshot) => {
    friends.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  });
};

// ส่งคำขอเป็นเพื่อน
const sendFriendRequest = async (toUserId) => {
  try {
    const friendsRef = collection(db, "friends");
    await addDoc(friendsRef, {
      from: currentUser.value.id,
      to: toUserId,
      status: "pending",
    });

    showAlert({
      message: "ส่งคำขอเป็นเพื่อนสำเร็จ",
      type: "success",
    });
  } catch (error) {
    console.error("Error:", error);
    showAlert({
      message: "ไม่สามารถส่งคำขอได้",
      type: "error",
    });
  }
};

// ตอบรับ/ปฏิเสธคำขอเป็นเพื่อน
const handleFriendRequest = async (requestId, status) => {
  try {
    const requestRef = doc(db, "friends", requestId);
    if (status === "rejected") {
      await deleteDoc(requestRef);
    } else {
      await updateDoc(requestRef, { status });
    }

    showAlert({
      message:
        status === "accepted"
          ? "ยอมรับคำขอเป็นเพื่อนแล้ว"
          : "ปฏิเสธคำขอเป็นเพื่อนแล้ว",
      type: "success",
    });
  } catch (error) {
    console.error("Error:", error);
    showAlert({
      message: "ไม่สามารถดำเนินการได้",
      type: "error",
    });
  }
};

// กรองรายชื่อผู้ใช้ตามคำค้นหา
const filteredUsers = computed(() => {
  const search = searchTerm.value.toLowerCase();
  return users.value.filter(
    (user) =>
      user.name.toLowerCase().includes(search) &&
      !friends.value.some(
        (friend) =>
          (friend.from === user.id || friend.to === user.id) &&
          friend.status === "accepted"
      )
  );
});
</script>

<template>
  <div class="friend-page">
    <!-- เพิ่มปุ่มกลับ -->
    <button class="back-button" @click="router.push('/home')">
      <span class="back-icon">←</span>
      กลับหน้าหลัก
    </button>

    <div class="friend-container">
      <!-- ส่วนค้นหาและเพิ่มเพื่อน -->
      <div class="search-section">
        <h2>ค้นหาเพื่อน</h2>
        <input
          type="text"
          v-model="searchTerm"
          placeholder="ค้นหาตามชื่อ..."
          class="search-input" />
        <div class="users-list">
          <div v-for="user in filteredUsers" :key="user.id" class="user-item">
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
            <button @click="sendFriendRequest(user.id)" class="add-friend-btn">
              เพิ่มเพื่อน
            </button>
          </div>
        </div>
      </div>

      <!-- ส่วนคำขอเป็นเพื่อน -->
      <div class="requests-section" v-if="friendRequests.length > 0">
        <h2>คำขอเป็นเพื่อน ({{ friendRequests.length }})</h2>
        <div class="requests-list">
          <div
            v-for="request in friendRequests"
            :key="request.id"
            class="request-item">
            <div class="user-info">
              <span class="user-name">
                {{ users.find((u) => u.id === request.from)?.name }}
              </span>
            </div>
            <div class="request-actions">
              <button
                @click="handleFriendRequest(request.id, 'accepted')"
                class="accept-btn">
                ยอมรับ
              </button>
              <button
                @click="handleFriendRequest(request.id, 'rejected')"
                class="reject-btn">
                ปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ส่วนรายชื่อเพื่อน -->
      <div class="friends-section">
        <h2>เพื่อนของคุณ ({{ friends.length }})</h2>
        <div class="friends-list">
          <div v-for="friend in friends" :key="friend.id" class="friend-item">
            <div class="user-info">
              <span class="user-name">
                {{
                  users.find(
                    (u) =>
                      u.id ===
                      (friend.from === currentUser.id ? friend.to : friend.from)
                  )?.name
                }}
              </span>
            </div>
            <button @click="router.push('/home')" class="chat-btn">แชท</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.friend-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 40px 20px;
  padding-top: 80px;
}

.friend-container {
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  gap: 30px;
}

.search-section,
.requests-section,
.friends-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #2d3748;
  margin-bottom: 20px;
  font-size: 1.5em;
}

.search-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 1em;
}

.user-item,
.request-item,
.friend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #2d3748;
}

.user-email {
  font-size: 0.9em;
  color: #718096;
}

.add-friend-btn,
.accept-btn,
.reject-btn,
.chat-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-friend-btn,
.chat-btn {
  background: #4a7bff;
  color: white;
  border: none;
}

.accept-btn {
  background: #48bb78;
  color: white;
  border: none;
  margin-right: 8px;
}

.reject-btn {
  background: #f56565;
  color: white;
  border: none;
}

.add-friend-btn:hover,
.chat-btn:hover {
  background: #3867e0;
}

.accept-btn:hover {
  background: #38a169;
}

.reject-btn:hover {
  background: #e53e3e;
}

.request-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 640px) {
  .friend-container {
    gap: 20px;
  }

  .user-item,
  .request-item,
  .friend-item {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .request-actions {
    width: 100%;
    justify-content: center;
  }

  .back-button {
    top: 12px;
    left: 12px;
    padding: 8px 16px;
    font-size: 0.9em;
  }
  
  .friend-page {
    padding-top: 60px;
  }
}

.back-button {
  position: fixed;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #4a7bff;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(74, 123, 255, 0.3);
}

.back-button:hover {
  background: #3867e0;
  transform: translateY(-1px);
}

.back-icon {
  font-size: 1.2em;
}
</style>
