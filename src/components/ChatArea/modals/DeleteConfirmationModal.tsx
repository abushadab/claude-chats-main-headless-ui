"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/headless-button";

interface DeleteConfirmationModalProps {
  showDeleteModal: string | null;
  onClose: () => void;
  onConfirmDelete: (messageId: string) => void;
}

export function DeleteConfirmationModal({ 
  showDeleteModal, 
  onClose, 
  onConfirmDelete 
}: DeleteConfirmationModalProps) {
  if (!showDeleteModal) return null;
  
  return (
    <Dialog open={!!showDeleteModal} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">Delete Message?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This message will be deleted. You can undo this action for 10 seconds.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => onConfirmDelete(showDeleteModal)}
            >
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}