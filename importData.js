const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://int305fb-default-rtdb.firebaseio.com",
});

const db = getFirestore();

// Sample Data
const users = [
  {
    name: "Alice",
    email: "alice@example.com",
    uid: "user_uid_1",
    friends: ["user_uid_2", "user_uid_3"],
    isOnline: true,
    settings: { theme: "dark", notifications: true },
  },
  {
    name: "Bob",
    email: "bob@example.com",
    uid: "user_uid_2",
    friends: ["user_uid_1"],
    isOnline: false,
    settings: { theme: "light", notifications: false },
  },
  {
    name: "Charlie",
    email: "charlie@example.com",
    uid: "user_uid_3",
    friends: ["user_uid_1", "user_uid_4"],
    isOnline: false,
    settings: { theme: "dark", notifications: true },
  },
  {
    name: "David",
    email: "david@example.com",
    uid: "user_uid_4",
    friends: ["user_uid_3", "user_uid_5"],
    isOnline: true,
    settings: { theme: "light", notifications: false },
  },
  {
    name: "Emma",
    email: "emma@example.com",
    uid: "user_uid_5",
    friends: ["user_uid_4", "user_uid_6"],
    isOnline: false,
    settings: { theme: "dark", notifications: true },
  },
  {
    name: "Frank",
    email: "frank@example.com",
    uid: "user_uid_6",
    friends: ["user_uid_5", "user_uid_7"],
    isOnline: true,
    settings: { theme: "light", notifications: true },
  },
  {
    name: "Grace",
    email: "grace@example.com",
    uid: "user_uid_7",
    friends: ["user_uid_6", "user_uid_8"],
    isOnline: false,
    settings: { theme: "dark", notifications: false },
  },
  {
    name: "Hannah",
    email: "hannah@example.com",
    uid: "user_uid_8",
    friends: ["user_uid_7", "user_uid_9"],
    isOnline: true,
    settings: { theme: "light", notifications: true },
  },
  {
    name: "Ian",
    email: "ian@example.com",
    uid: "user_uid_9",
    friends: ["user_uid_8", "user_uid_10"],
    isOnline: false,
    settings: { theme: "dark", notifications: true },
  },
  {
    name: "Jane",
    email: "jane@example.com",
    uid: "user_uid_10",
    friends: ["user_uid_9"],
    isOnline: true,
    settings: { theme: "light", notifications: false },
  },
];

const friends = [
  { from: "user_uid_1", to: "user_uid_2", status: "accepted" },
  { from: "user_uid_2", to: "user_uid_1", status: "accepted" },
  { from: "user_uid_1", to: "user_uid_3", status: "pending" },
  { from: "user_uid_3", to: "user_uid_1", status: "pending" },
  { from: "user_uid_4", to: "user_uid_5", status: "accepted" },
  { from: "user_uid_5", to: "user_uid_4", status: "accepted" },
  { from: "user_uid_6", to: "user_uid_7", status: "pending" },
  { from: "user_uid_7", to: "user_uid_6", status: "pending" },
  { from: "user_uid_8", to: "user_uid_9", status: "accepted" },
  { from: "user_uid_9", to: "user_uid_8", status: "accepted" },
];

const messages = [
  {
    from: "user_uid_1",
    to: "user_uid_2",
    message: "Hey Bob!",
    timestamp: new Date(),
    isRead: true,
  },
  {
    from: "user_uid_2",
    to: "user_uid_1",
    message: "Hi Alice!",
    timestamp: new Date(),
    isRead: false,
  },
  {
    from: "user_uid_3",
    to: "user_uid_2",
    message: "Hello Bob!",
    timestamp: new Date(),
    isRead: true,
  },
  {
    from: "user_uid_4",
    to: "user_uid_5",
    message: "How are you?",
    timestamp: new Date(),
    isRead: false,
  },
  {
    from: "user_uid_5",
    to: "user_uid_4",
    message: "I’m good!",
    timestamp: new Date(),
    isRead: true,
  },
  {
    from: "user_uid_6",
    to: "user_uid_7",
    message: "Let’s meet up.",
    timestamp: new Date(),
    isRead: false,
  },
  {
    from: "user_uid_7",
    to: "user_uid_6",
    message: "Sure, when?",
    timestamp: new Date(),
    isRead: true,
  },
  {
    from: "user_uid_8",
    to: "user_uid_9",
    message: "Did you get my email?",
    timestamp: new Date(),
    isRead: false,
  },
  {
    from: "user_uid_9",
    to: "user_uid_8",
    message: "Yes, thanks!",
    timestamp: new Date(),
    isRead: true,
  },
  {
    from: "user_uid_10",
    to: "user_uid_9",
    message: "What’s the plan?",
    timestamp: new Date(),
    isRead: false,
  },
];

async function importData() {
  try {
    console.log("Starting data import...");

    const usersRef = db.collection("users");
    for (const obj of users) {
      await usersRef.doc(obj.uid).set({
        name: obj.name,
        email: obj.email,
        friends: obj.friends,
      });
      console.log(`User Document written for UID: ${obj.uid}`);
    }

    const friendsRef = db.collection("friends");
    for (const obj of friends) {
      await friendsRef.add({
        from: obj.from,
        to: obj.to,
        status: obj.status,
      });
      console.log(`Friend Document written from: ${obj.from} to: ${obj.to}`);
    }

    const messagesRef = db.collection("messages");
    for (const obj of messages) {
      await messagesRef.add({
        from: obj.from,
        to: obj.to,
        message: obj.message,
        timestamp: obj.timestamp,
      });
      console.log(`Message Document written from: ${obj.from} to: ${obj.to}`);
    }

    console.log("Data import completed successfully!");
  } catch (error) {
    console.error("Error importing data:", error);
  }
}

importData();
