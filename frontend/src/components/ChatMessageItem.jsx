import React from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, MessageCircle, UserCircle, Bot, Loader2 } from 'lucide-react'; // 👈 Added Loader2
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ChatMessageItem = ({ message, developerMode, isRetrying, onVote, onComment }) => {
  const isUser = message.sender === 'User';
  const formattedTimestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex items-end space-x-2 max-w-[75%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {isUser ? (
          <UserCircle className="h-8 w-8 text-slate-400 flex-shrink-0" />
        ) : (
          <Bot className="h-8 w-8 text-primary flex-shrink-0" />
        )}
        <Card className={`rounded-xl shadow-md ${isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none'}`}>
          <CardContent className="p-3">
            <p className="text-sm font-semibold mb-1">{message.sender}</p>
            
            {/* 👇 Message text or loading spinner */}
            <p className="text-base whitespace-pre-wrap min-h-[1.5rem]">
              {isRetrying ? (
                <span className="flex items-center gap-2 text-muted-foreground italic">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Retrying...
                </span>
              ) : (
                message.text
              )}
            </p>

            <div className={`text-xs mt-1 ${isUser ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
              {formattedTimestamp}
            </div>

            {/* 👇 Feedback + Developer mode for assistant messages only */}
            {!isUser && !isRetrying && (
              <>
                <div className="mt-2 flex space-x-2 items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${message.feedback?.type === 'up' ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:text-green-500'}`}
                        onClick={() => onVote('up')}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Good response</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${message.feedback?.type === 'down' ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-red-500'}`}
                        onClick={() => onVote('down')}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Bad response</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${message.feedback?.comment ? 'text-blue-500 bg-blue-500/10' : 'text-muted-foreground hover:text-blue-500'}`}
                        onClick={onComment}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Add comment</p></TooltipContent>
                  </Tooltip>
                </div>
                {message.feedback?.comment && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="mt-1 text-xs italic text-blue-600 dark:text-blue-400 cursor-default">
                        Feedback: "{message.feedback.comment.substring(0, 30)}{message.feedback.comment.length > 30 ? '...' : ''}"
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs break-words">
                      <p className="font-semibold">Full Feedback:</p>
                      <p>{message.feedback.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(message.feedback.timestamp).toLocaleString()}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {developerMode && (
                  <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground space-y-0.5">
                    <div className="flex gap-4">
                      <p>BLEU-1: {message.bleu1}</p>
                      <p>BLEU-2: {message.bleu2}</p>
                      <p>BLEU-3: {message.bleu3}</p>
                      <p>BLEU-4: {message.bleu4}</p>
                    </div>
                    <p>ROGUE Score: {message.rogue}</p>
                    {message.feedback && (
                      <p>User Feedback: {message.feedback.type} {message.feedback.comment ? `(${message.feedback.comment.substring(0,15)}...)` : ''}</p>
                    )}
                    <p>Timestamp: {message.timestamp}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default ChatMessageItem;