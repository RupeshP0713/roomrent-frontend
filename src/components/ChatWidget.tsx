import { useState, useEffect, useRef } from 'react';
import { messageApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
    _id: string;
    senderId: string;
    senderRole: string;
    content: string;
    timestamp: string;
    isRead: boolean;
}

export default function ChatWidget({ userId, role }: { userId: string; role: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    const fetchMessages = async () => {
        try {
            const response = await messageApi.getMessages();
            setMessages(response.data);
            // Mark as read when opening
            if (isOpen) {
                await messageApi.markAsRead();
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await messageApi.getUnreadCount();
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            setLoading(true);
            const receiverRole = 'admin';
            const receiverId = 'rohit'; // Hardcoded admin ID for now

            const response = await messageApi.sendMessage({
                receiverId,
                receiverRole,
                content: newMessage,
            });

            setMessages([...messages, response.data.data]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchUnreadCount();

        // Poll for messages and unread count
        const interval = setInterval(() => {
            if (isOpen) {
                fetchMessages();
            } else {
                fetchUnreadCount();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchMessages();
            scrollToBottom();
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col h-[500px] border border-gray-200 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-t-2xl flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2">
                            <span>💬</span> {t('supportChat') || 'Support Chat'}
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-white/20 p-1 rounded-full transition"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10 text-sm">
                                <p>{t('startConversation') || 'Start a conversation with Admin'}</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMe = msg.senderId === userId;
                                return (
                                    <div
                                        key={msg._id}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                }`}
                                        >
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={sendMessage} className="p-3 border-t bg-white rounded-b-2xl">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={t('typeMessage') || 'Type a message...'}
                                className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                            <button
                                type="submit"
                                disabled={loading || !newMessage.trim()}
                                className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                ➤
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-all duration-300 relative group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                            {unreadCount}
                        </span>
                    )}
                    <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                        {t('chatWithAdmin') || 'Chat with Admin'}
                    </span>
                </button>
            )}
        </div>
    );
}
