'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MessageSquare,
  Search,
  Send,
  User,
  Clock,
  Check,
  CheckCheck,
  X,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  subject: string | null;
  status: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  lastMessageAt: string | null;
  lastMessageBy: string | null;
  unreadByAdmin: number;
  createdAt: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}

interface Message {
  id: string;
  content: string;
  attachments: any[];
  isRead: boolean;
  createdAt: string;
  senderId: string;
  senderFirstName: string;
  senderLastName: string;
  senderEmail: string;
  senderRole: string;
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const userId = searchParams.get('userId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle userId parameter - get or create conversation for that user
  useEffect(() => {
    if (userId) {
      getOrCreateConversation(userId);
    }
  }, [userId]);

  // Handle selectedId parameter
  useEffect(() => {
    if (selectedId && conversations.length > 0) {
      const convo = conversations.find(c => c.id === selectedId);
      if (convo) {
        selectConversation(convo);
      }
    }
  }, [selectedId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/conversations?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateConversation = async (targetUserId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/conversations/user/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        // Refresh conversations list
        await fetchConversations();
        // Select this conversation
        selectConversation(data.conversation);
        // Update URL without userId
        router.replace(`/admin/messages?id=${data.conversation.id}`);
      }
    } catch (error) {
      console.error('Error getting conversation:', error);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    router.replace(`/admin/messages?id=${conversation.id}`);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/conversations/${conversation.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        // Update unread count in list
        setConversations(prev =>
          prev.map(c => c.id === conversation.id ? { ...c, unreadByAdmin: 0 } : c)
        );
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/conversations/${selectedConversation.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          ...data.message,
          senderFirstName: 'Admin',
          senderLastName: '',
          senderEmail: '',
          senderRole: 'admin',
        }]);
        setNewMessage('');
        // Update conversation in list
        setConversations(prev =>
          prev.map(c => c.id === selectedConversation.id
            ? { ...c, lastMessageAt: new Date().toISOString(), lastMessageBy: 'admin' }
            : c
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(c =>
    !search ||
    c.userFirstName?.toLowerCase().includes(search.toLowerCase()) ||
    c.userLastName?.toLowerCase().includes(search.toLowerCase()) ||
    c.userEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Conversations List */}
      <div className={cn(
        "w-full md:w-80 border-r border-gray-200 flex flex-col",
        selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Messages {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                className={cn(
                  "w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors",
                  selectedConversation?.id === conversation.id && "bg-blue-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center text-white font-medium shrink-0">
                    {conversation.userFirstName?.[0]}{conversation.userLastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {conversation.userFirstName} {conversation.userLastName}
                      </span>
                      {conversation.lastMessageAt && (
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.userEmail}
                    </p>
                    {conversation.unreadByAdmin > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-brand-gold text-brand-dark text-xs rounded-full">
                        {conversation.unreadByAdmin} new
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedConversation(null);
                  router.replace('/admin/messages');
                }}
                className="md:hidden p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center text-white font-medium">
                {selectedConversation.userFirstName?.[0]}{selectedConversation.userLastName?.[0]}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {selectedConversation.userFirstName} {selectedConversation.userLastName}
                </h3>
                <p className="text-sm text-gray-500">{selectedConversation.userEmail}</p>
              </div>
              <span className={cn(
                "px-2 py-1 text-xs rounded-full",
                selectedConversation.status === 'open'
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              )}>
                {selectedConversation.status}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isAdmin = message.senderRole === 'admin';
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isAdmin ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2",
                        isAdmin
                          ? "bg-brand-dark text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                      )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div className={cn(
                          "flex items-center gap-1 mt-1 text-xs",
                          isAdmin ? "text-white/70" : "text-gray-400"
                        )}>
                          <span>{formatTime(message.createdAt)}</span>
                          {isAdmin && (
                            message.isRead
                              ? <CheckCheck className="h-3 w-3" />
                              : <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sendingMessage}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="bg-brand-dark hover:bg-brand-dark/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the list to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
