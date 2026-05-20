'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { messageApi } from '@/lib/api';
import { Send, User, Loader2, ArrowLeft, Mail } from 'lucide-react';
import styles from './messages.module.css';

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChatId = searchParams.get('chatId');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await messageApi.getConversations();
        setConversations(data || []);
        
        if (initialChatId && data.find((c: any) => c.id === initialChatId)) {
          loadChat(initialChatId);
        } else if (data.length > 0 && !activeChat) {
          loadChat(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [initialChatId]);

  const loadChat = async (conversationId: string) => {
    try {
      const { data } = await messageApi.getChatHistory(conversationId);
      setActiveChat(data.conversation);
      setMessages(data.messages || []);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const { data } = await messageApi.sendMessage(activeChat.id, content);
      setMessages([...messages, data]);
      
      // Update last message in the left sidebar
      setConversations(prev => prev.map(c => 
        c.id === activeChat.id ? { ...c, last_message: content, updated_at: new Date().toISOString() } : c
      ));
      
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const getChatPartnerName = (conv: any) => {
    if (!currentUser || !conv) return 'Unknown';
    const partner = conv.participant_1_id === currentUser.id ? conv.participant_2 : conv.participant_1;
    return partner?.email || partner?.id || 'Unknown User';
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={40} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        {/* Left Sidebar - Chat List */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <button onClick={() => router.push('/units')} className={styles.backBtn} title="Kembali ke Dashboard">
              <ArrowLeft size={18} />
            </button>
            <h2 className={styles.sidebarTitle}>Pesan Masuk</h2>
          </div>
          <div className={styles.conversationList}>
            {conversations.length === 0 ? (
              <div className={styles.emptyStateSidebar}>Belum ada percakapan.</div>
            ) : (
              conversations.map((conv) => (
                <div 
                  key={conv.id} 
                  className={`${styles.conversationItem} ${activeChat?.id === conv.id ? styles.active : ''}`}
                  onClick={() => loadChat(conv.id)}
                >
                  <div className={styles.avatarPlaceholder}>
                    <User size={20} />
                  </div>
                  <div className={styles.conversationDetails}>
                    <div className={styles.conversationName}>{getChatPartnerName(conv)}</div>
                    <div className={styles.lastMessage}>{conv.last_message || 'Mulai percakapan...'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Area - Chat Window */}
        <div className={styles.chatWindow}>
          {activeChat ? (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.avatarPlaceholder}>
                  <User size={20} />
                </div>
                <div className={styles.chatHeaderDetails}>
                  <div className={styles.chatHeaderName}>{getChatPartnerName(activeChat)}</div>
                  <div className={styles.chatHeaderStatus}>Live Chat</div>
                </div>
              </div>

              <div className={styles.messagesContainer}>
                {messages.length === 0 ? (
                  <div className={styles.emptyStateChat}>Belum ada pesan. Mulai sapa sekarang!</div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    return (
                      <div key={msg.id} className={`${styles.messageWrapper} ${isMe ? styles.messageMe : styles.messageThem}`}>
                        <div className={styles.messageBubble}>
                          {msg.content}
                          <div className={styles.messageTime}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className={styles.inputArea} onSubmit={handleSend}>
                <input 
                  type="text" 
                  className={styles.messageInput} 
                  placeholder="Ketik pesan..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" className={styles.sendBtn} disabled={!newMessage.trim() || sending}>
                  {sending ? <Loader2 size={18} className={styles.spin} /> : <Send size={18} />}
                </button>
              </form>
            </>
          ) : (
            <div className={styles.noChatSelected}>
              <Mail size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <h3>Tidak ada obrolan terpilih</h3>
              <p>Pilih percakapan dari panel sebelah kiri untuk mulai mengirim pesan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
