// services/firestore.service.js
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore,
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  getDocs,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ✅ Initialize Firebase App (singleton)
let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
  console.log('✅ Firebase App initialized');
} else {
  firebaseApp = getApps()[0];
  console.log('✅ Using existing Firebase App');
}

// ✅ Initialize Firestore with muslifie database (singleton)
let firestoreDb;
try {
  // Try to initialize with muslifie database
  firestoreDb = initializeFirestore(firebaseApp, {
    databaseId: 'muslifie'
  });
  console.log('✅ Firestore initialized with muslifie database');
} catch (error) {
  // Already initialized, get existing instance
  firestoreDb = getFirestore(firebaseApp);
  console.log('⚠️ Using existing Firestore instance (may be default database)');
  console.log('⚠️ If messages don\'t appear, refresh the page');
}

// ✅ Initialize Firebase Auth (singleton)
const firebaseAuth = getAuth(firebaseApp);

class FirestoreService {
  constructor() {
    this.app = firebaseApp;
    this.auth = firebaseAuth;
    this.db = firestoreDb;
    this.unsubscribers = new Map();
    this.isAuthenticated = false;
    
    // Listen to auth state changes
    this._setupAuthListener();
  }

  _setupAuthListener() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log('✅ Firebase Auth: User signed in', user.uid);
        this.isAuthenticated = true;
      } else {
        console.log('⚠️ Firebase Auth: User signed out');
        this.isAuthenticated = false;
      }
    });
  }

  // Initialize (just for compatibility, everything is already initialized)
  initialize() {
    console.log('✅ FirestoreService already initialized');
  }

  // Sign in admin with Firebase custom token
  async signInWithToken(firebaseToken) {
    try {
      console.log('🔐 Signing admin into Firebase Auth...');
      const userCredential = await signInWithCustomToken(this.auth, firebaseToken);
      console.log('✅ Admin signed into Firebase Auth:', userCredential.user.uid);
      this.isAuthenticated = true;
      return true;
    } catch (error) {
      console.error('❌ Firebase Auth sign-in failed:', error);
      this.isAuthenticated = false;
      throw error;
    }
  }

  // Check if authenticated
  waitForAuth() {
    return new Promise((resolve) => {
      if (this.isAuthenticated) {
        resolve(true);
        return;
      }

      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        if (user) {
          console.log('✅ Auth ready:', user.uid);
          this.isAuthenticated = true;
          unsubscribe();
          resolve(true);
        }
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, 5000);
    });
  }

  // Listen to conversations for admin (all conversations)
  listenToConversations(onUpdate, onError) {
    try {
      const conversationsRef = collection(this.db, 'conversations');
      const q = query(
        conversationsRef,
        where('status', '==', 'active'),
        orderBy('lastMessageAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const conversations = [];
          snapshot.forEach((doc) => {
            conversations.push({
              id: doc.id,
              conversationId: doc.id,
              ...doc.data()
            });
          });
          
          console.log('📋 Firestore: Conversations updated', conversations.length);
          onUpdate(conversations);
        },
        (error) => {
          console.error('❌ Firestore conversations listener error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          if (onError) onError(error);
        }
      );

      this.unsubscribers.set('conversations', unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('❌ Failed to setup conversations listener:', error);
      if (onError) onError(error);
    }
  }

  listenToMessages(conversationId, onUpdate, onError) {
    try {
      console.log('🔍 Setting up Firestore listener for:', conversationId);
      
      const messagesRef = collection(
        this.db, 
        'conversations', 
        conversationId, 
        'messages'
      );
      
      console.log('🔍 Messages collection path:', messagesRef.path);
      
      const q = query(
        messagesRef,
        orderBy('createdAt', 'asc')
      );
  
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('📸 Snapshot received:', {
            empty: snapshot.empty,
            size: snapshot.size,
            docs: snapshot.docs.length
          });
          
          const messages = [];
          snapshot.forEach((doc) => {
            console.log('📄 Message doc:', doc.id, doc.data());
            const data = doc.data();
            messages.push({
              _id: doc.id,
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              timestamp: data.timestamp?.toDate?.() || new Date()
            });
          });
          
          console.log('💬 Firestore: Messages updated', messages.length);
          onUpdate(messages);
        },
        (error) => {
          console.error('❌ Firestore messages listener error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          if (onError) onError(error);
        }
      );
  
      this.unsubscribers.set(`messages_${conversationId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('❌ Failed to setup messages listener:', error);
      if (onError) onError(error);
    }
  }

  // Mark messages as read in Firestore
  async markMessagesAsRead(conversationId, adminId) {
    try {
      const messagesRef = collection(
        this.db, 
        'conversations', 
        conversationId, 
        'messages'
      );
      
      const q = query(
        messagesRef,
        where('senderId', '!=', adminId)
      );

      const snapshot = await getDocs(q);
      
      const updatePromises = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (!data.readBy?.includes(adminId)) {
          updatePromises.push(
            updateDoc(docSnapshot.ref, {
              readBy: arrayUnion(adminId)
            })
          );
        }
      });

      await Promise.all(updatePromises);
      
      // Reset unread count in conversation
      const conversationRef = doc(this.db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${adminId}`]: 0
      });

      console.log('✅ Marked messages as read in Firestore');
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  }

  // Clean up a specific listener
  unsubscribe(key) {
    const unsubscribe = this.unsubscribers.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(key);
      console.log(`🔌 Unsubscribed from ${key}`);
    }
  }

  // Clean up all listeners
  unsubscribeAll() {
    this.unsubscribers.forEach((unsubscribe, key) => {
      unsubscribe();
      console.log(`🔌 Unsubscribed from ${key}`);
    });
    this.unsubscribers.clear();
  }

  // Sign out
  async signOut() {
    if (this.auth) {
      await this.auth.signOut();
      this.isAuthenticated = false;
      console.log('👋 Signed out from Firebase Auth');
    }
  }
}

// Export singleton instance
const firestoreService = new FirestoreService();
export default firestoreService;