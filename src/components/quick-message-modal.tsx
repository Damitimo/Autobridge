'use client';

import { useState } from 'react';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface QuickMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  bidRequestId: string;
  vehicleTitle?: string;
  onSuccess?: (conversationId: string) => void;
}

export default function QuickMessageModal({
  isOpen,
  onClose,
  bidRequestId,
  vehicleTitle,
  onSuccess,
}: QuickMessageModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/conversations/quick-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bidRequestId,
          message: message.trim(),
          vehicleTitle,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('');
        onClose();
        if (onSuccess) {
          onSuccess(data.conversationId);
        }
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-brand-dark text-white p-4 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-brand-dark" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Send a Message</h2>
              {vehicleTitle && (
                <p className="text-white/70 text-sm truncate max-w-[250px]">
                  Re: {vehicleTitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <Textarea
              placeholder="Type your message here... (e.g., questions about the vehicle, special instructions)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="flex-1 bg-brand-dark hover:bg-brand-dark/90"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Our team typically responds within 2-4 hours
          </p>
        </div>
      </div>
    </div>
  );
}
