"use client"

import { useState } from "react";
import { ChevronDown, User, LogOut, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/headless-avatar";
import { Button } from "@/components/ui/headless-button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/headless-scroll-area";

export function UserProfile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Fallback if user not loaded yet
  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-9 w-16 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const currentUser = {
    name: user.fullName || user.username,
    avatar: getInitials(user.fullName || user.username),
    status: "online",
    email: user.email
  };

  // Mock notifications
  const notifications = [
    {
      id: '1',
      type: 'mention',
      title: 'Sarah Chen mentioned you',
      message: 'in #development channel',
      time: '2 minutes ago',
      read: false,
      avatar: 'SC'
    },
    {
      id: '2',
      type: 'project',
      title: 'New project created',
      message: 'LaunchDB project was created by Alex Rodriguez',
      time: '1 hour ago',
      read: false,
      avatar: 'AR'
    },
    {
      id: '3',
      type: 'message',
      title: 'New message',
      message: 'You have 3 unread messages in #general',
      time: '2 hours ago',
      read: true,
      avatar: null
    },
    {
      id: '4',
      type: 'system',
      title: 'System update',
      message: 'DevTeam Chat has been updated to version 2.1.0',
      time: '1 day ago',
      read: true,
      avatar: null
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleProfileAction = async (action: string) => {
    setShowDropdown(false);
    
    if (action === 'profile') {
      router.push('/profile');
    } else if (action === 'logout') {
      setIsLoggingOut(true);
      try {
        await logout();
        // Redirect is handled by the logout function
      } catch (error) {
        console.error('Logout failed:', error);
        // Fallback redirect if logout fails
        router.push('/login');
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  const markAsRead = (notificationId: string) => {
    // This would update the notification in real app
    console.log('Mark notification as read:', notificationId);
  };

  const markAllAsRead = () => {
    console.log('Mark all notifications as read');
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Notifications */}
      <Popover open={showNotifications} onOpenChange={setShowNotifications}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="end">
          <div className="space-y-1">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-medium text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-auto p-1 text-muted-foreground hover:text-foreground"
                >
                  Mark all as read
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <ScrollArea className="max-h-96">
              <div className="space-y-1 p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg transition-colors cursor-pointer group ${
                      !notification.read 
                        ? 'bg-primary/5 hover:bg-primary/10' 
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {notification.avatar ? (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {notification.avatar}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.time}
                            </p>
                          </div>
                          
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {notifications.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* User Profile */}
      <Popover open={showDropdown} onOpenChange={setShowDropdown}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-9 px-2 py-1 flex items-center space-x-2 hover:bg-accent rounded-lg transition-colors"
          >
            <div className="relative">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {currentUser.avatar}
                </AvatarFallback>
              </Avatar>
              {/* Online status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-background"></div>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-foreground">{currentUser.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{currentUser.status}</div>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
      
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          {/* User Info Header - Compact */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {currentUser.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground truncate">{currentUser.name}</div>
              <div className="text-xs text-muted-foreground truncate">{currentUser.email}</div>
              <div className="text-xs text-green-600 capitalize mt-0.5">{currentUser.status}</div>
            </div>
          </div>

          {/* Menu Items - No borders */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 px-2 text-sm hover:bg-accent"
              onClick={() => handleProfileAction('profile')}
            >
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 px-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleProfileAction('logout')}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
      </Popover>
    </div>
  );
}