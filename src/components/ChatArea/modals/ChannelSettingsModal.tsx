"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/headless-button";
import { Input } from "@/components/ui/headless-input";
import { Settings } from "lucide-react";
import type { Channel } from "@/types/chat.types";

// Custom Toggle Switch Component (preserved from original)
const ToggleSwitch = ({ checked, onCheckedChange, disabled = false }: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void; 
  disabled?: boolean 
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onCheckedChange(!checked)}
    className={`
      relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
      transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
      ${checked ? 'bg-primary' : 'bg-input'} 
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}
    `}
  >
    <span
      className={`
        pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 
        transition-transform duration-200 ease-in-out
        ${checked ? 'translate-x-4' : 'translate-x-0'}
      `}
    />
  </button>
);

interface NotificationSettings {
  muteNotifications: boolean;
  desktopNotifications: boolean;
}

interface ChannelSettingsModalProps {
  showChannelSettingsModal: boolean;
  onClose: () => void;
  channel: Channel;
  notificationSettings: NotificationSettings;
  onNotificationSettingsChange: (settings: NotificationSettings) => void;
  onSave: () => void;
}

export function ChannelSettingsModal({ 
  showChannelSettingsModal,
  onClose,
  channel,
  notificationSettings,
  onNotificationSettingsChange,
  onSave
}: ChannelSettingsModalProps) {
  
  const handleSave = () => {
    onClose();
    // Small delay to ensure modal closes before toast appears
    setTimeout(() => {
      onSave();
    }, 100);
  };

  return (
    <Dialog open={showChannelSettingsModal} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Channel Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Channel Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Channel Information</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Channel Name</label>
                <Input value={channel?.name || ''} readOnly className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <Input placeholder="Add a description..." className="mt-1" />
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Privacy & Access</h4>
            <div className="space-y-4">
              <div className="flex items-start justify-between py-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Private Channel</div>
                  <div className="text-xs text-muted-foreground">Only invited members can access this channel</div>
                </div>
                <ToggleSwitch 
                  checked={channel?.is_private || false} 
                  onCheckedChange={() => {}} 
                  disabled={true}
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
            <div className="space-y-4">
              <div className="flex items-start justify-between py-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Mute notifications</div>
                  <div className="text-xs text-muted-foreground">Turn off all notifications for this channel</div>
                </div>
                <ToggleSwitch 
                  checked={notificationSettings.muteNotifications} 
                  onCheckedChange={(checked) => onNotificationSettingsChange({
                    ...notificationSettings,
                    muteNotifications: checked
                  })}
                />
              </div>
              <div className="flex items-start justify-between py-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Desktop notifications</div>
                  <div className="text-xs text-muted-foreground">Show desktop notifications for new messages</div>
                </div>
                <ToggleSwitch 
                  checked={notificationSettings.desktopNotifications} 
                  onCheckedChange={(checked) => onNotificationSettingsChange({
                    ...notificationSettings,
                    desktopNotifications: checked
                  })}
                  disabled={notificationSettings.muteNotifications}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}