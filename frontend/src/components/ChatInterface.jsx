import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatMessageItem from '@/components/ChatMessageItem';

const ChatInterface = ({
  messages,
  developerMode,
  onSendMessage,
  onFeedback,
  onOpenFeedbackModal,
  retryingMessageId
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const handleSend = () => {
    if (inputValue.trim() === '') return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <>
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              developerMode={developerMode}
              isRetrying={retryingMessageId === msg.id}
              onVote={(type) => onFeedback(msg.id, type)}
              onComment={() => onOpenFeedbackModal(msg)}
            />
          ))}
        </AnimatePresence>
        {/* This dummy div is used to scroll into view */}
        <div ref={messagesEndRef} />
      </div>
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="p-4 border-t border-primary/20 bg-slate-800/50"
      >
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-grow bg-slate-700/50 border-slate-600 placeholder-slate-400 text-slate-100 focus:ring-accent"
          />
          <Button onClick={handleSend} size="icon" className="bg-primary hover:bg-primary/90">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>
    </>
  );
};

export default ChatInterface;