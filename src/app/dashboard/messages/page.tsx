'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  Headphones,
  Car,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  attachments: any[];
  isRead: boolean;
  createdAt: string;
  senderId: string;
  senderFirstName: string;
  senderLastName: string;
  senderRole: string;
}

interface BidRequest {
  id: string;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleImageUrl: string | null;
  maxBidAmount: string;
  status: string;
  lotNumber: string | null;
}

interface Conversation {
  id: string;
  subject: string | null;
  status: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  lastMessageAt: string | null;
  lastMessageBy: string | null;
  unreadByUser: number;
  createdAt: string;
  bidRequest: BidRequest | null;
  lastMessage: {
    content: string;
    createdAt: string;
    isFromAdmin: boolean;
  } | null;
}

export default function CustomerMessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('conversation');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationSubject, setConversationSubject] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [isMobileThreadView, setIsMobileThreadView] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv && selectedConversation?.id !== conv.id) {
        selectConversation(conv);
      } else if (!conv) {
        // Conversation not in list, fetch messages directly
        fetchMessages(conversationId);
        setCurrentConversationId(conversationId);
        setIsMobileThreadView(true);
      }
    } else if (conversations.length > 0 && !selectedConversation && !conversationId) {
      // Auto-select first conversation on desktop when no conversation ID in URL
      selectConversation(conversations[0]);
    }
  }, [conversationId, conversations.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/conversations/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
        // If we have a conversation ID in URL, select it
        if (conversationId) {
          const conv = data.conversations.find((c: Conversation) => c.id === conversationId);
          if (conv) {
            selectConversation(conv);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    setCurrentConversationId(conv.id);
    setConversationSubject(conv.subject || '');
    setIsMobileThreadView(true);
    await fetchMessages(conv.id);
    // Update URL
    router.push(`/dashboard/messages?conversation=${conv.id}`, { scroll: false });
  };

  const fetchMessages = async (convId: string) => {
    setLoadingMessages(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/conversations?id=${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        setCurrentConversationId(data.conversation?.id || convId);
        setConversationSubject(data.conversation?.subject || '');
        // Update unread count in conversations list
        setConversations(prev => prev.map(c =>
          c.id === convId ? { ...c, unreadByUser: 0 } : c
        ));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage,
          conversationId: currentConversationId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          ...data.message,
          senderFirstName: 'You',
          senderLastName: '',
          senderRole: 'user',
        }]);
        setNewMessage('');
        // Update last message in conversations list
        setConversations(prev => prev.map(c =>
          c.id === currentConversationId
            ? {
                ...c,
                lastMessage: {
                  content: newMessage,
                  createdAt: new Date().toISOString(),
                  isFromAdmin: false
                },
                lastMessageAt: new Date().toISOString(),
              }
            : c
        ));
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

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' }) + ' ' +
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getVehicleTitle = (conv: Conversation) => {
    if (conv.bidRequest) {
      const { vehicleYear, vehicleMake, vehicleModel } = conv.bidRequest;
      if (vehicleYear && vehicleMake && vehicleModel) {
        return `${vehicleYear} ${vehicleMake} ${vehicleModel}`;
      }
    }
    // For general conversations, don't show "Conversation with [user name]"
    if (conv.subject?.startsWith('Conversation with')) {
      return 'General Inquiry';
    }
    return conv.subject || 'General Inquiry';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-180px)]">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex">
        {/* Left Side - Conversations List */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col",
          isMobileThreadView && "hidden md:flex"
        )}>
          <div className="p-4 border-b border-gray-200 bg-brand-dark text-white">
            <h2 className="font-semibold text-lg">Messages</h2>
            <p className="text-sm text-white/70">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a conversation from your bids page</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={cn(
                    "flex items-start gap-3 p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                    selectedConversation?.id === conv.id && "bg-brand-gold/10 border-l-4 border-l-brand-gold"
                  )}
                >
                  {/* Vehicle Image or Icon */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                    {conv.bidRequest?.vehicleImageUrl ? (
                      <Image
                        src={conv.bidRequest.vehicleImageUrl}
                        alt="Vehicle"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-sm truncate">
                        {getVehicleTitle(conv)}
                      </h3>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {conv.lastMessageAt && formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    {conv.bidRequest?.lotNumber && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Lot #{conv.bidRequest.lotNumber}
                      </p>
                    )}
                    {conv.lastMessage && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {conv.lastMessage.isFromAdmin ? 'Support: ' : 'You: '}
                        {conv.lastMessage.content}
                      </p>
                    )}
                    {conv.unreadByUser > 0 && (
                      <div className="mt-1">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-brand-gold text-brand-dark text-xs font-medium rounded-full">
                          {conv.unreadByUser} new
                        </span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 hidden md:block" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Messages Thread */}
        <div className={cn(
          "flex-1 flex flex-col",
          !isMobileThreadView && "hidden md:flex"
        )}>
          {selectedConversation || currentConversationId ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-gray-200 bg-brand-dark text-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsMobileThreadView(false);
                      router.push('/dashboard/messages', { scroll: false });
                    }}
                    className="md:hidden p-1 hover:bg-white/10 rounded"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  {selectedConversation?.bidRequest?.vehicleImageUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={selectedConversation.bidRequest.vehicleImageUrl}
                        alt="Vehicle"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center flex-shrink-0">
                      <Headphones className="h-5 w-5 text-brand-dark" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h2 className="font-semibold truncate">
                      {selectedConversation ? getVehicleTitle(selectedConversation) : 'AutoBridge Support'}
                    </h2>
                    {selectedConversation?.bidRequest?.lotNumber ? (
                      <p className="text-sm text-brand-gold">Lot #{selectedConversation.bidRequest.lotNumber}</p>
                    ) : (
                      <p className="text-sm text-white/70">We typically reply within a few hours</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-dark"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Start the conversation</h3>
                    <p className="text-sm max-w-xs mx-auto">
                      Send a message and we'll get back to you as soon as possible.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isUser = message.senderRole !== 'admin';
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isUser ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2",
                          isUser
                            ? "bg-brand-dark text-white"
                            : "bg-white border border-gray-200 text-gray-900"
                        )}>
                          {!isUser && (
                            <p className="text-xs text-brand-gold font-medium mb-1">
                              AutoBridge Support
                            </p>
                          )}
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-xs",
                            isUser ? "text-white/70 justify-end" : "text-gray-400"
                          )}>
                            <span>{formatMessageTime(message.createdAt)}</span>
                            {isUser && (
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
                    placeholder="Type your message..."
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
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a conversation from the list to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
