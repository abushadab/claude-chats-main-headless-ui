"use client"

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/headless-input";
import { Button } from "@/components/ui/headless-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Hash, 
  Lock,
  Globe,
  Users,
  Sparkles,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText
} from "lucide-react";

interface CreateChannelModalProps {
  showCreateChannelModal: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onChannelCreated: (channelData: {
    name: string;
    description?: string;
    isPrivate?: boolean;
  }) => void;
}


export function CreateChannelModal({ 
  showCreateChannelModal, 
  onClose, 
  projectId,
  projectName,
  onChannelCreated
}: CreateChannelModalProps) {
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteMembers, setInviteMembers] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [nameError, setNameError] = useState("");
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  console.log('CreateChannelModal render - showSuccess:', showSuccess, 'isCreating:', isCreating, 'showCreateChannelModal:', showCreateChannelModal);

  // Format channel name (lowercase, replace spaces with hyphens)
  const formatChannelName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  // Validate channel name
  const validateChannelName = (name: string) => {
    if (!name.trim()) {
      setNameError("Channel name is required");
      return false;
    }
    if (name.length < 3) {
      setNameError("Channel name must be at least 3 characters");
      return false;
    }
    if (name.length > 30) {
      setNameError("Channel name must be less than 30 characters");
      return false;
    }
    if (!/^[a-zA-Z0-9-\s]+$/.test(name)) {
      setNameError("Channel name can only contain letters, numbers, hyphens and spaces");
      return false;
    }
    setNameError("");
    return true;
  };

  // Handle channel name change
  const handleChannelNameChange = (value: string) => {
    setChannelName(value);
    if (value) {
      validateChannelName(value);
    } else {
      setNameError("");
    }
  };

  // Handle create channel
  const handleCreateChannel = async () => {
    console.log('handleCreateChannel called, current showSuccess:', showSuccess);
    
    if (!validateChannelName(channelName)) {
      return;
    }

    console.log('Setting isCreating=true, showSuccess=false');
    setIsCreating(true);
    setShowSuccess(false); // Ensure success is false when starting new creation

    try {
      const formattedName = formatChannelName(channelName);
      
      const channelData = {
        name: formattedName,
        description: channelDescription || undefined,
        isPrivate: isPrivate,
      };

      console.log('Calling onChannelCreated with:', channelData);
      // Call parent callback which handles the actual API call
      await onChannelCreated(channelData);
      
      console.log('Success! Setting showSuccess=true');
      // Only show success animation if we reach this point (no error thrown)
      setIsCreating(false);
      setShowSuccess(true);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset form and close after animation
      console.log('Setting timeout to close modal in 1.5s');
      timeoutRef.current = setTimeout(() => {
        console.log('Timeout fired - resetting form and closing modal');
        setChannelName("");
        setChannelDescription("");
        setIsPrivate(false);
        setInviteMembers(true);
        setShowSuccess(false);
        timeoutRef.current = null;
        
        onClose();
      }, 1500);
    } catch (error: any) {
      // Error occurred, don't show success animation
      console.log('Channel creation error in modal, setting success to false');
      setShowSuccess(false);
      setIsCreating(false);
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Error toast is handled by parent component
    }
  };

  // Reset form when modal opens or closes
  useEffect(() => {
    console.log('Modal state changed, showCreateChannelModal:', showCreateChannelModal, 'current showSuccess:', showSuccess);
    
    if (showCreateChannelModal) {
      // Clear any pending timeout when opening modal
      if (timeoutRef.current) {
        console.log('Clearing existing timeout on modal open');
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Reset success state when opening modal
      console.log('Modal opening - resetting showSuccess to false');
      setShowSuccess(false);
      setIsCreating(false);
    } else {
      // Clear any pending timeout when closing modal
      if (timeoutRef.current) {
        console.log('Clearing existing timeout on modal close');
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Reset entire form when closing modal
      console.log('Modal closing - resetting entire form');
      setChannelName("");
      setChannelDescription("");
      setIsPrivate(false);
      setInviteMembers(true);
      setShowSuccess(false);
      setNameError("");
      setIsCreating(false);
    }
  }, [showCreateChannelModal]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={showCreateChannelModal} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showSuccess ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Channel Created!
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Create a New Channel
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {showSuccess ? (
          // Success Animation
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Channel Created Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              #{formatChannelName(channelName)} is ready to use
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Channel Name */}
            <div className="space-y-2">
              <Label htmlFor="channel-name" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Channel Name
              </Label>
              <Input
                id="channel-name"
                placeholder="e.g., general-discussion"
                value={channelName}
                onChange={(e) => handleChannelNameChange(e.target.value)}
                className={nameError ? "border-red-500" : ""}
                disabled={isCreating}
              />
              {nameError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {nameError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Will be formatted as: #{channelName ? formatChannelName(channelName) : 'channel-name'}
              </p>
            </div>

            {/* Channel Description */}
            <div className="space-y-2">
              <Label htmlFor="channel-description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description (optional)
              </Label>
              <Textarea
                id="channel-description"
                placeholder="What's this channel about?"
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                rows={3}
                className="resize-none"
                disabled={isCreating}
              />
            </div>

            {/* Channel Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  <div>
                    <Label htmlFor="private-channel" className="text-sm font-medium">
                      Private Channel
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isPrivate ? "Only invited members can view" : "All project members can view"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="private-channel"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                  disabled={isCreating}
                />
              </div>

              {isPrivate && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <Label htmlFor="invite-members" className="text-sm font-medium">
                        Invite Members
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically invite all project members
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="invite-members"
                    checked={inviteMembers}
                    onCheckedChange={setInviteMembers}
                    disabled={isCreating}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {!showSuccess && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateChannel}
              disabled={isCreating || !channelName.trim() || !!nameError}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Channel
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}