import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './context/AuthContext';
import { db } from './config/firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  type: 'invite' | 'bundle' | 'clinic' | 'system';
  title: string;
  content: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

export default function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchMessages();
  }, [user]);

  const fetchMessages = async () => {
    if (!user?.id) return "bro";

    try {
      const messagesRef = collection(db, 'notifications');
      console.log(user.id,);
      const q = query(
        messagesRef,
        where('userId', '==', user.id)
      );
      console.log(q,query);
      const messagesSnapshot = await getDocs(q);  
      console.log(messagesSnapshot, 'messagesSnapshot'); 
      const messagesList = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Message[];
      
      setMessages(messagesList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (message: Message) => {
    try {
      // Update the patient's therapist in Firestore
      await updateDoc(doc(db, 'patients', message.data.patientId), {
        therapistId: message.data.therapistId,
        isAppUser: true,
        updatedAt: Timestamp.now(),
      });

      // Mark message as read
      await updateDoc(doc(db, 'notifications', message.id), {
        read: true,
        status: 'accepted',
      });

      // Refresh messages
      fetchMessages();
      Alert.alert('Success', 'Invitation accepted successfully');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', 'Failed to accept invitation');
    }
  };

  const handleDenyInvite = async (message: Message) => {
    try {
      // Mark message as read and denied
      await updateDoc(doc(db, 'notifications', message.id), {
        read: true,
        status: 'denied',
      });

      // Refresh messages
      fetchMessages();
      Alert.alert('Success', 'Invitation declined');
    } catch (error) {
      console.error('Error declining invitation:', error);
      Alert.alert('Error', 'Failed to decline invitation');
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={[styles.messageCard, !item.read && styles.unreadMessage]}
      onPress={() => {
        if (!item.read) {
          updateDoc(doc(db, 'notifications', item.id), { read: true });
          fetchMessages();
        }
      }}
    >
      <View style={styles.messageHeader}>
        <View style={styles.messageIcon}>
          {item.type === 'invite' && <Ionicons name="mail" size={24} color="#4A90E2" />}
          {item.type === 'bundle' && <Ionicons name="fitness" size={24} color="#4A90E2" />}
          {item.type === 'clinic' && <Ionicons name="business" size={24} color="#4A90E2" />}
          {item.type === 'system' && <Ionicons name="information-circle" size={24} color="#4A90E2" />}
        </View>
        <View style={styles.messageContent}>
          <Text style={styles.messageTitle}>{item.title}</Text>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.messageTime}>
            {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
          </Text>
        </View>
      </View>

      {item.type === 'invite' && !item.read && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptInvite(item)}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.denyButton]}
            onPress={() => handleDenyInvite(item)}
          >
            <Text style={styles.actionButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No messages yet</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadMessage: {
    backgroundColor: '#f0f9ff',
  },
  messageHeader: {
    flexDirection: 'row',
  },
  messageIcon: {
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  denyButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
}); 