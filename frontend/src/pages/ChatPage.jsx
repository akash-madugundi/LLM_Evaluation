import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import FeedbackDialog from "@/components/FeedbackDialog";
import PdfUpload from "@/components/PdfUpload";
import ChatInterface from "@/components/ChatInterface";

const ChatPage = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentMessageForFeedback, setCurrentMessageForFeedback] =
    useState(null);
  const [developerMode, setDeveloperMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    const savedDevMode = localStorage.getItem("developerMode");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    if (savedDevMode) {
      setDeveloperMode(JSON.parse(savedDevMode));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("developerMode", JSON.stringify(developerMode));
  }, [developerMode]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      toast({ title: "PDF Selected", description: file.name });
    } else {
      setPdfFile(null);
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select a PDF file.",
      });
    }
  };

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      const file = event.dataTransfer.files[0];
      if (file && file.type === "application/pdf") {
        setPdfFile(file);
        toast({ title: "PDF Dropped", description: file.name });
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: "Please drop a PDF file.",
        });
      }
    },
    [toast]
  );

  const handleFileUpload = async () => {
    if (!pdfFile) {
      toast({
        variant: "destructive",
        title: "No File",
        description: "Please select a PDF file to upload.",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", pdfFile);

      const response = await fetch("http://localhost:5000/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      // Optionally parse response
      const result = await response.json();

      setIsUploading(false);
      setIsProcessing(true);

      setTimeout(() => {
        setIsProcessing(false);
        const newAiMessage = {
          id: Date.now(),
          sender: "AI",
          text: `I've processed the document "${pdfFile.name}". How can I help you with it?`,
          timestamp: new Date().toISOString(),
          bleu1: 0.0,
          bleu2: 0.0,
          bleu3: 0.0,
          bleu4: 0.0,
          rogue: 0.0,
          feedback: null,
        };
        setMessages((prev) => [...prev, newAiMessage]);
        toast({
          title: "Processing Complete",
          description: `"${pdfFile.name}" is ready.`,
        });
      }, 2000);
    } catch (error) {
      setIsUploading(false);
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      });
    }
  };

  const handleSendMessage = async (inputValue) => {
    const newUserMessage = {
      id: Date.now(),
      sender: "User",
      text: inputValue,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const response = await fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: inputValue }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from backend.");
      }

      const data = await response.json();

      // Format the current time in readable format
      const now = new Date();
      const formattedTime = now.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const newAiMessage = {
        id: Date.now() + 1,
        sender: "AI",
        question: inputValue,
        text: data.answer,
        timestamp: formattedTime,
        bleu1:
          data.metrics?.Bleu_1 !== undefined
            ? data.metrics.Bleu_1.toFixed(2)
            : "0.00",
        bleu2:
          data.metrics?.Bleu_2 !== undefined
            ? data.metrics.Bleu_2.toFixed(2)
            : "0.00",
        bleu3:
          data.metrics?.Bleu_3 !== undefined
            ? data.metrics.Bleu_3.toFixed(2)
            : "0.00",
        bleu4:
          data.metrics?.Bleu_4 !== undefined
            ? data.metrics.Bleu_4.toFixed(2)
            : "0.00",
        rogue:
          data.metrics?.ROUGE_L !== undefined
            ? data.metrics.ROUGE_L.toFixed(2)
            : "0.00",
        feedback: null,
      };

      setMessages((prev) => [...prev, newAiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorAiMessage = {
        id: Date.now() + 1,
        sender: "AI",
        text: "Sorry, there was an error processing your question.",
        timestamp: new Date().toISOString(),
        bleu1: "0.00",
        bleu2: "0.00",
        bleu3: "0.00",
        bleu4: "0.00",
        rogue: "0.00",
        feedback: null,
      };
      setMessages((prev) => [...prev, errorAiMessage]);
    }
  };

  const handleFeedback = async (messageId, type = null, comment = null) => {
    // Update local state immediately
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              feedback: { type, comment, timestamp: new Date().toISOString() },
            }
          : msg
      )
    );

    // Show toast
    toast({
      title: "Feedback Submitted",
      description: `Thank you for your ${type} feedback!`,
    });

    // Close modal
    setShowFeedbackModal(false);
    setCurrentMessageForFeedback(null);

    // Send feedback to backend
    try {
      await fetch("http://localhost:5000/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: messageId,
          feedback_type: type,
          comment: comment,
        }),
      });
    } catch (error) {
      console.error("Failed to store feedback:", error);
    }
  };

  const openFeedbackModal = (message) => {
    setCurrentMessageForFeedback(message);
    setShowFeedbackModal(true);
  };

  const [retryingMessageId, setRetryingMessageId] = useState(null);
  const handleRetry = async (message) => {
    setShowFeedbackModal(false);
    setCurrentMessageForFeedback(null);
    setRetryingMessageId(message.id);

    try {
      const response = await fetch("http://localhost:5000/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: message.question, // assuming you've stored the question somewhere
          response: message.text,
        }),
      });

      const data = await response.json();
      // console.log("Retry response:", data);

      if (data.improved_answer) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === message.id
              ? {
                  ...msg,
                  text: data.improved_answer,
                  bleu1:
                    data.metrics?.Bleu_1 !== undefined
                      ? data.metrics.Bleu_1.toFixed(2)
                      : "0.00",
                  bleu2:
                    data.metrics?.Bleu_2 !== undefined
                      ? data.metrics.Bleu_2.toFixed(2)
                      : "0.00",
                  bleu3:
                    data.metrics?.Bleu_3 !== undefined
                      ? data.metrics.Bleu_3.toFixed(2)
                      : "0.00",
                  bleu4:
                    data.metrics?.Bleu_4 !== undefined
                      ? data.metrics.Bleu_4.toFixed(2)
                      : "0.00",
                  rogue:
                    data.metrics?.ROUGE_L !== undefined
                      ? data.metrics.ROUGE_L.toFixed(2)
                      : "0.00",
                  feedback: null, // reset feedback if needed
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Retry request failed:", error);
    } finally {
      setRetryingMessageId(null); // Clear retrying state
    }
  };

  const isPdfProcessed = messages.some(
    (msg) => msg.sender === "AI" && msg.text.includes("processed the document")
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl h-[calc(100vh-4rem)] flex flex-col bg-card/80 backdrop-blur-md shadow-2xl rounded-xl overflow-hidden border border-primary/20"
    >
      <header className="p-4 border-b border-primary/20 flex justify-between items-center bg-slate-800/50">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
            AI Chat Agent
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeveloperMode(!developerMode)}
          title={
            developerMode ? "Disable Developer Mode" : "Enable Developer Mode"
          }
        >
          <Settings
            className={`h-5 w-5 ${
              developerMode ? "text-accent" : "text-muted-foreground"
            }`}
          />
        </Button>
      </header>

      {!isPdfProcessed ? (
        <PdfUpload
          pdfFile={pdfFile}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          isProcessing={isProcessing}
          onFileChange={handleFileChange}
          onFileUpload={handleFileUpload}
          onDrop={handleDrop}
        />
      ) : (
        <ChatInterface
          messages={messages}
          developerMode={developerMode}
          onSendMessage={handleSendMessage}
          onFeedback={handleFeedback}
          onOpenFeedbackModal={openFeedbackModal}
          retryingMessageId={retryingMessageId}
        />
      )}

      {currentMessageForFeedback && (
        <FeedbackDialog
          isOpen={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            setCurrentMessageForFeedback(null);
          }}
          onSubmit={(comment) =>
            handleFeedback(currentMessageForFeedback.id, null, comment)
          }
          onRetry={handleRetry}
          message={currentMessageForFeedback}
        />
      )}
    </motion.div>
  );
};

export default ChatPage;
