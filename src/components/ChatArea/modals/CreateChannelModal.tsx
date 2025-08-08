"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/headless-input";
import { Button } from "@/components/ui/headless-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { 
  Hash, 
  Lock,
  Globe,
  Users,
  MessageSquare,
  Sparkles,
  CheckCircle,
  Loader2,
  AlertCircle,
  Volume2,
  FileText,
  Code,
  Palette,
  Briefcase
} from "lucide-react";

interface CreateChannelModalProps {
  showCreateChannelModal: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onChannelCreated: (channel: {
    id: string;
    name: string;
    type: 'text' | 'voice';
    isPrivate: boolean;
    description?: string;
  }) => void;
}

const channelTypes = [
  { 
    value: 'general', 
    label: 'General', 
    icon: MessageSquare, 
    description: 'For general discussions'
  },
  { 
    value: 'announcements', 
    label: 'Announcements', 
    icon: Volume2, 
    description: 'Important updates and news'
  },
  { 
    value: 'development', 
    label: 'Development', 
    icon: Code, 
    description: 'Code and development discussions'
  },
  { 
    value: 'design', 
    label: 'Design', 
    icon: Palette, 
    description: 'Design feedback and reviews'
  },
  { 
    value: 'docs', 
    label: 'Documentation', 
    icon: FileText, 
    description: 'Documentation and guides'
  },
  { 
    value: 'business', 
    label: 'Business', 
    icon: Briefcase, 
    description: 'Business and strategy'
  }
];

export function CreateChannelModal({ 
  showCreateChannelModal, 
  onClose, 
  projectId,
  projectName,
  onChannelCreated
}: CreateChannelModalProps) {
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [channelType, setChannelType] = useState("general");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isVoiceChannel, setIsVoiceChannel] = useState(false);
  const [inviteMembers, setInviteMembers] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [nameError, setNameError] = useState("");
  const { toast } = useToast();

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
    if (!validateChannelName(channelName)) {
      return;
    }

    setIsCreating(true);

    // Simulate API call
    setTimeout(() => {
      const formattedName = formatChannelName(channelName);
      const newChannel = {
        id: `c${Date.now()}`,
        name: formattedName,
        type: isVoiceChannel ? 'voice' as const : 'text' as const,
        isPrivate,
        description: channelDescription,
        category: channelType
      };

      // Show success animation
      setIsCreating(false);
      setShowSuccess(true);

      // Show success toast
      toast({
        title: "Channel created successfully",
        description: (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            <span>#{formattedName} has been created in {projectName}</span>
          </div>
        ),
      });

      // Call parent callback after animation
      setTimeout(() => {
        onChannelCreated(newChannel);
        
        // Reset form
        setChannelName("");
        setChannelDescription("");
        setChannelType("general");
        setIsPrivate(false);
        setIsVoiceChannel(false);
        setInviteMembers(true);
        setShowSuccess(false);
        
        onClose();
      }, 1500);
    }, 1000);
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!showCreateChannelModal) {
      setChannelName("");
      setChannelDescription("");
      setChannelType("general");
      setIsPrivate(false);
      setIsVoiceChannel(false);
      setInviteMembers(true);
      setShowSuccess(false);
      setNameError("");
    }
  }, [showCreateChannelModal]);

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

            {/* Channel Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Channel Type
              </Label>
              <RadioGroup value={channelType} onValueChange={setChannelType} disabled={isCreating}>
                <div className="grid grid-cols-2 gap-2">
                  {channelTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div key={type.value}>
                        <RadioGroupItem
                          value={type.value}
                          id={type.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={type.value}
                          className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-background p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                        >
                          <Icon className="h-5 w-5 mb-1" />
                          <span className="text-xs font-medium">{type.label}</span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <div>
                    <Label htmlFor="voice-channel" className="text-sm font-medium">
                      Voice Channel
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable voice communication
                    </p>
                  </div>
                </div>
                <Switch
                  id="voice-channel"
                  checked={isVoiceChannel}
                  onCheckedChange={setIsVoiceChannel}
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