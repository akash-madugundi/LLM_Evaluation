import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const AnalysisModal = ({ isOpen, onClose, analysisData, loading }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-card border-primary/30 text-foreground max-h-[80vh] flex flex-col"
        as={motion.div}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <DialogHeader>
          <DialogTitle className="text-primary text-xl">Document Analysis</DialogTitle>
          <DialogDescription>
            Detailed analysis of the processed PDF document.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 overflow-y-auto flex-grow pr-2">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading analysis data...</p>
            </div>
          )}
          {!loading && analysisData && (
            <pre className="whitespace-pre-wrap bg-slate-800/60 p-4 rounded-md text-sm text-slate-200 overflow-x-auto">
              {JSON.stringify(analysisData, null, 2)}
            </pre>
          )}
          {!loading && !analysisData && (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
              <p className="text-muted-foreground">No analysis data to show. Try processing a document first.</p>
            </div>
          )}
        </div>
        <DialogFooter className="mt-auto pt-4 border-t border-border">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisModal;