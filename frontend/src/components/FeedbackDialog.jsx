import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const FeedbackDialog = ({ isOpen, onClose, onSubmit, onRetry, message }) => {
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const positiveTags = ["Helpful", "Accurate", "Clear explanation"];
  const negativeTags = ["Too vague", "Inaccurate", "Not actionable"];

  useEffect(() => {
    setComment(message?.feedback?.comment || "");
    setSelectedTags(message?.feedback?.tags || []);
  }, [message]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    const tagString = selectedTags.length
      ? `[${selectedTags.join(", ")}] `
      : "";
    const fullComment = `${tagString}${comment}`;
    onSubmit(fullComment.trim());
    setComment("");
    setSelectedTags([]);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[425px] bg-card border-primary/30"
        as={motion.div}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <DialogHeader>
          <DialogTitle className="text-primary">Detailed Feedback</DialogTitle>
          <DialogDescription>
            Share tags and comments to help us improve future responses.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-left text-foreground/80">
              Positive Tags
            </Label>
            <div className="flex flex-wrap gap-2">
              {positiveTags.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={`text-xs px-3 py-1 rounded-full ${
                    selectedTags.includes(tag)
                      ? "bg-green-500 text-white"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-left text-foreground/80">
              Negative Tags
            </Label>
            <div className="flex flex-wrap gap-2">
              {negativeTags.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={`text-xs px-3 py-1 rounded-full ${
                    selectedTags.includes(tag)
                      ? "bg-red-500 text-white"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="feedback-comment"
              className="text-left text-foreground/80"
            >
              Your Comment
            </Label>
            <Textarea
              id="feedback-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Type your feedback here..."
              className="bg-background/50 border-input focus:ring-accent"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>

          {selectedTags.some((tag) => negativeTags.includes(tag)) && (
            <Button
              type="button"
              onClick={() => onRetry?.(message)}
              variant="outline"
              className="text-red-600 border-red-400 hover:bg-red-500"
            >
              Retry
            </Button>
          )}

          <Button
            type="submit"
            onClick={handleSubmit}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
