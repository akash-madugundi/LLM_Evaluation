import React from 'react';
import ChatPage from '@/pages/ChatPage';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-foreground flex flex-col items-center justify-center p-4 dark">
        <ChatPage />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

export default App;