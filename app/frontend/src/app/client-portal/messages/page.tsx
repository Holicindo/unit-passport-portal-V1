'use client';

import { useState, useEffect, useRef } from 'react';
import { messageApi } from '@/lib/api';
import { MessageSquare, Send, User, Plus, HeadphonesIcon } from 'lucide-react';
import styles from '../ClientPortal.module.css';
import msgStyles from './messages.module.css';

export default function ClientMessages() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv]       = useState<any>(null);
  const [messages, setMessages]           = useState<any[]>([]);
  const [input, setInput]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [sendError, setSendError]         = useState('');
  const [loading, setLoading]             = useState(true);
  const [starting, setStarting]           = useState(false);
  const [user, setUser]                   = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  // Ambil daftar percakapan
  useEffect(() => {
    messageApi.getConversations()
      .then(({ data }) => setConversations(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Ambil history chat saat percakapan dipilih
  useEffect(() => {
    if (!activeConv) return;

    const fetchMessages = () => {
      messageApi.getChatHistory(activeConv.id)
        .then(({ data }) => {
          const msgs = data?.messages || data || [];
          setMessages(msgs);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        })
        .catch(console.error);
    };

    fetchMessages();

    // Poll setiap 5 detik
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConv]);

  const handleSend = async () => {
    if (!input.trim() || !activeConv) return;
    setSending(true);
    setSendError('');
    const text = input.trim();
    setInput('');

    // Optimistic update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content: text,
      sender: { id: user?.id },
      created_at: new Date().toISOString(),
      _temp: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      await messageApi.sendMessage(activeConv.id, text);
    } catch {
      setSendError('Gagal mengirim pesan. Silakan coba lagi.');
      setInput(text); // kembalikan teks
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } finally {
      setSending(false);
    }
  };

  // Mulai percakapan baru dengan tim support Holicindo
  const handleStartConversation = async () => {
    setStarting(true);
    try {
      const { data } = await messageApi.startConversation('support');
      const newConv = data?.conversation || data;
      if (newConv?.id) {
        setConversations(prev => {
          const exists = prev.find(c => c.id === newConv.id);
          return exists ? prev : [newConv, ...prev];
        });
        setActiveConv(newConv);
      } else {
        // Refresh dan pakai conversation pertama
        const { data: convData } = await messageApi.getConversations();
        const convs = convData || [];
        setConversations(convs);
        if (convs.length > 0) setActiveConv(convs[0]);
      }
    } catch (err: any) {
      // Kalau sudah ada conversation (conflict), ambil yang existing
      if (err?.response?.status === 409 || err?.response?.status === 400) {
        try {
          const { data: convData } = await messageApi.getConversations();
          const convs = convData || [];
          setConversations(convs);
          if (convs.length > 0) setActiveConv(convs[0]);
        } catch { /* silent */ }
      }
      // Untuk error lain tidak block UI, cukup log
    } finally {
      setStarting(false);
    }
  };

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || '?';

  const getPartnerName = (conv: any) => {
    const other = conv.participants?.find((p: any) => p.id !== user?.id);
    return other?.name || 'Tim Holicindo';
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Pesan</h1>
        <p className={styles.pageDescription}>
          Komunikasi langsung dengan tim Holicindo untuk dukungan unit Anda.
        </p>
      </div>

      <div className={msgStyles.chatLayout}>

        {/* ── Panel Kiri: Daftar Percakapan ── */}
        <div className={msgStyles.convPanel}>
          <div className={msgStyles.convHeader}>
            <span className={msgStyles.convHeaderTitle}>Percakapan</span>
            <button
              className={msgStyles.newConvBtn}
              onClick={handleStartConversation}
              disabled={starting}
              aria-label="Hubungi Support"
              title="Mulai percakapan baru"
            >
              <Plus size={15} />
            </button>
          </div>

          {loading ? (
            <div className={msgStyles.convEmpty}>
              <div className={styles.skeleton} style={{ height: 14, width: '70%', marginBottom: 8 }} />
              <div className={styles.skeleton} style={{ height: 14, width: '50%' }} />
            </div>
          ) : conversations.length === 0 ? (
            <div className={msgStyles.convEmpty}>
              <HeadphonesIcon size={32} color="var(--brand-space-grey)" />
              <p style={{ textAlign: 'center', fontSize: '0.82rem' }}>Belum ada percakapan</p>
              <button
                className={styles.btnPrimary}
                style={{ fontSize: '0.78rem', padding: '8px 16px', marginTop: '4px' }}
                onClick={handleStartConversation}
                disabled={starting}
              >
                <Plus size={13} />
                {starting ? 'Menghubungi...' : 'Hubungi Support'}
              </button>
            </div>
          ) : (
            <div className={msgStyles.convList}>
              {conversations.map(conv => {
                const isActive = activeConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    className={`${msgStyles.convItem} ${isActive ? msgStyles.convItemActive : ''}`}
                    onClick={() => setActiveConv(conv)}
                  >
                    <div className={msgStyles.convAvatar}>
                      {getInitial(getPartnerName(conv))}
                    </div>
                    <div className={msgStyles.convInfo}>
                      <div className={msgStyles.convName}>{getPartnerName(conv)}</div>
                      <div className={msgStyles.convPreview}>
                        {conv.last_message || 'Mulai percakapan...'}
                      </div>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className={msgStyles.unreadBadge}>{conv.unread_count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Panel Kanan: Chat Window ── */}
        <div className={msgStyles.chatPanel}>
          {!activeConv ? (
            <div className={msgStyles.chatEmpty}>
              <div className={styles.emptyStateIcon} style={{ width: 72, height: 72, borderRadius: '50%' }}>
                <MessageSquare size={32} />
              </div>
              <div className={styles.emptyStateTitle}>
                {conversations.length === 0 ? 'Belum ada percakapan' : 'Pilih percakapan'}
              </div>
              <div className={styles.emptyStateDesc}>
                {conversations.length === 0
                  ? 'Klik "Hubungi Support" untuk mulai berkomunikasi dengan tim Holicindo.'
                  : 'Pilih percakapan di sebelah kiri untuk mulai berkomunikasi dengan tim Holicindo.'
                }
              </div>
              {conversations.length === 0 && (
                <button
                  className={styles.btnPrimary}
                  style={{ marginTop: '16px' }}
                  onClick={handleStartConversation}
                  disabled={starting}
                >
                  <HeadphonesIcon size={15} />
                  {starting ? 'Menghubungi...' : 'Hubungi Support Holicindo'}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Header chat */}
              <div className={msgStyles.chatHeader}>
                <div className={msgStyles.chatHeaderAvatar}>
                  {getInitial(getPartnerName(activeConv))}
                </div>
                <div>
                  <div className={msgStyles.chatHeaderName}>{getPartnerName(activeConv)}</div>
                  <div className={msgStyles.chatHeaderSub}>Tim Holicindo</div>
                </div>
              </div>

              {/* Pesan */}
              <div className={msgStyles.chatMessages}>
                {messages.length === 0 ? (
                  <div className={msgStyles.chatNoMsg}>Belum ada pesan. Mulai percakapan!</div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender?.id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`${msgStyles.msgRow} ${isMine ? msgStyles.msgRowMine : msgStyles.msgRowOther}`}
                      >
                        {!isMine && (
                          <div className={msgStyles.msgAvatar}>
                            <User size={14} />
                          </div>
                        )}
                        <div className={`${msgStyles.msgBubble} ${isMine ? msgStyles.msgBubbleMine : msgStyles.msgBubbleOther}`}>
                          <p className={msgStyles.msgText}>{msg.content}</p>
                          <span className={msgStyles.msgTime}>
                            {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input kirim pesan */}
              <div className={msgStyles.chatInputArea}>
                {sendError && (
                  <p className={msgStyles.sendError}>{sendError}</p>
                )}
                <div className={msgStyles.chatInputRow}>
                  <input
                    type="text"
                    className={msgStyles.chatInput}
                    placeholder="Ketik pesan..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    disabled={sending}
                  />
                  <button
                    className={msgStyles.sendBtn}
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    aria-label="Kirim pesan"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
