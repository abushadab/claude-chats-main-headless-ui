"use client"

import { useState } from "react";
import { Bell, Moon, Monitor, Sun, Shield } from "lucide-react";
import { Button } from "@/components/ui/headless-button";
import { Switch } from "@/components/ui/switch";

export function SettingsPage() {
  const [settings, setSettings] = useState({
    // Notifications
    desktopNotifications: true,
    soundNotifications: true,
    mentionNotifications: true,
    
    // Appearance
    theme: 'system', // 'light', 'dark', 'system'
    compactMode: false,
    
    // Privacy
    showOnlineStatus: true,
  });

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const SettingItem = ({ label, description, checked, onChange }: { 
    label: string, 
    description?: string, 
    checked: boolean, 
    onChange: (checked: boolean) => void 
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-sm text-muted-foreground mt-1">{description}</div>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your chat preferences</p>
      </div>

      {/* All Settings in One Card */}
      <div className="bg-background border border-border rounded-lg p-6 space-y-6">
        
        {/* Notifications */}
        <div className="space-y-3">
          <h3 className="flex items-center text-lg font-medium text-foreground">
            <Bell className="h-5 w-5 text-primary mr-2" />
            Notifications
          </h3>
          <div className="pl-7 space-y-1 border-l-2 border-border">
            <SettingItem
              label="Desktop Notifications"
              description="Show notifications when you receive messages"
              checked={settings.desktopNotifications}
              onChange={(checked) => handleSettingChange('desktopNotifications', checked)}
            />
            <SettingItem
              label="Sound Notifications"
              description="Play a sound when you receive messages"
              checked={settings.soundNotifications}
              onChange={(checked) => handleSettingChange('soundNotifications', checked)}
            />
            <SettingItem
              label="Mention Notifications"
              description="Get notified when someone mentions you"
              checked={settings.mentionNotifications}
              onChange={(checked) => handleSettingChange('mentionNotifications', checked)}
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="space-y-3">
          <h3 className="flex items-center text-lg font-medium text-foreground">
            <Monitor className="h-5 w-5 text-primary mr-2" />
            Appearance
          </h3>
          <div className="pl-7 space-y-4 border-l-2 border-border">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Theme</label>
              <div className="flex space-x-2">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'Auto', icon: Monitor }
                ].map(({ value, label, icon: ThemeIcon }) => (
                  <button
                    key={value}
                    onClick={() => handleSettingChange('theme', value)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md border text-sm transition-colors ${
                      settings.theme === value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:bg-accent'
                    }`}
                  >
                    <ThemeIcon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <SettingItem
              label="Compact Mode"
              description="Show more messages with reduced spacing"
              checked={settings.compactMode}
              onChange={(checked) => handleSettingChange('compactMode', checked)}
            />
          </div>
        </div>

        {/* Privacy */}
        <div className="space-y-3">
          <h3 className="flex items-center text-lg font-medium text-foreground">
            <Shield className="h-5 w-5 text-primary mr-2" />
            Privacy
          </h3>
          <div className="pl-7 border-l-2 border-border">
            <SettingItem
              label="Show Online Status"
              description="Let others see when you're online"
              checked={settings.showOnlineStatus}
              onChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}