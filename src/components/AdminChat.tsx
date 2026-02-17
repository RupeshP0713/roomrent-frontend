import { useState, useEffect, useRef } from 'react';
import { messageApi } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface Message {
    _id: string;
    senderId: string;
    senderRole: string;
    content: string;
    timestamp: string;
    isRead: boolean;
}

interface Conversation {
    _id: string;
    role: string;
    name: string;
    contact: string;
    unreadCount: number;
    lastMessage: string;
    timestamp: string;
}

export default function AdminChat() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUser, setSelectedUser] = useState<{ id: string; role: string } | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch unread conversations
    const fetchConversations = async () => {
        try {
            const response = await messageApi.getConversations();
            setConversations(response.data);
        } catch (error) {
            console.error('Failed to fetch conversations', error);
        }
    };

    // Fetch messages for selected user
    const fetchMessages = async (userId: string, role: string) => {
        try {
            setLoading(true);
            const response = await messageApi.getMessages(userId, role);
            setMessages(response.data);
            // Mark as read
            await messageApi.markAsRead(userId);
            fetchConversations(); // Refresh counts
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id, selectedUser.role);
            const interval = setInterval(() => {
                // Poll for new messages in active chat without full reload logic if simple
                // ideally we'd separate fetch and mark read, but reuse for now
                messageApi.getMessages(selectedUser.id, selectedUser.role).then(res => setMessages(res.data));
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedUser?.id]); // Only re-run if user changes

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            const response = await messageApi.sendMessage({
                receiverId: selectedUser.id,
                receiverRole: selectedUser.role,
                content: newMessage,
            });

            setMessages([...messages, response.data.data]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex h-[600px] border border-gray-200 mt-8">
            {/* Sidebar: User List */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="font-bold text-gray-800">Inbox</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No new messages</div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv._id}
                                onClick={() => setSelectedUser({ id: conv._id, role: conv.role })}
                                className={`p-4 cursor-pointer hover:bg-white transition border-b border-gray-100 ${selectedUser?.id === conv._id ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className="font-semibold text-gray-900 truncate text-sm">{conv.name || conv._id}</h3>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                {new Date(conv.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1 font-mono">{conv.contact}</p>
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-600 truncate flex-1 pr-2">{conv.lastMessage}</p>
                                            {conv.unreadCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="w-2/3 flex flex-col bg-white">
                {selectedUser ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-gray-800">Chat with {
                                    conversations.find(c => c._id === selectedUser.id)?.name || selectedUser.id
                                }</h3>
                                <div className="flex gap-2 text-xs text-gray-500 capitalize items-center">
                                    <span>{selectedUser.role}</span>
                                    <span>•</span>
                                    <span>{conversations.find(c => c._id === selectedUser.id)?.contact}</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {loading && messages.length === 0 ? (
                                <div className="flex justify-center p-4"><LoadingSpinner /></div>
                            ) : (
                                messages.map((msg) => {
                                    const isAdmin = msg.senderRole === 'admin';
                                    return (
                                        <div key={msg._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isAdmin
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                                    }`}
                                            >
                                                <p>{msg.content}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a reply..."
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition font-medium"
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-2">💬</span>
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
