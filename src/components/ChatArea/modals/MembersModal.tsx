"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/headless-button";
import { Input } from "@/components/ui/headless-input";
import { ScrollArea } from "@/components/ui/headless-scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/headless-avatar";
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  LogOut,
  Search,
  Mail,
  MoreVertical,
  Check,
  Copy
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
  designation: string;
  status: 'online' | 'away' | 'offline';
  joinedDate: string;
}

interface MembersModalProps {
  showMembersModal: boolean;
  onClose: () => void;
  channelName: string;
  currentUserId?: string;
  isAdmin: boolean;
  onSystemMessage?: (message: string, userName: string, type: 'user_joined' | 'user_left' | 'user_removed' | 'user_added' | 'role_changed') => void;
}

export function MembersModal({ 
  showMembersModal, 
  onClose, 
  channelName,
  currentUserId = 'current',
  isAdmin,
  onSystemMessage
}: MembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();

  // Mock members data - including AI agents
  const [members, setMembers] = useState<Member[]>([
    {
      id: 'current',
      name: 'Abu Shadab',
      email: 'abu.shadab@company.com',
      avatar: 'AS',
      role: 'owner',
      designation: 'CEO & Founder',
      status: 'online',
      joinedDate: 'Jan 2023'
    },
    {
      id: '2',
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
      avatar: 'SC',
      role: 'admin',
      designation: 'CTO',
      status: 'online',
      joinedDate: 'Feb 2023'
    },
    {
      id: '3',
      name: 'Alex Rodriguez',
      email: 'alex.r@company.com',
      avatar: 'AR',
      role: 'member',
      designation: 'Senior React Developer',
      status: 'away',
      joinedDate: 'Mar 2023'
    },
    {
      id: '4',
      name: 'Emily Johnson',
      email: 'emily.j@company.com',
      avatar: 'EJ',
      role: 'member',
      designation: 'Product Manager',
      status: 'offline',
      joinedDate: 'Apr 2023'
    },
    {
      id: '5',
      name: 'Michael Park',
      email: 'michael.p@company.com',
      avatar: 'MP',
      role: 'member',
      designation: 'UX Designer',
      status: 'online',
      joinedDate: 'May 2023'
    },
    {
      id: '6',
      name: 'Lisa Wang',
      email: 'lisa.w@company.com',
      avatar: 'LW',
      role: 'admin',
      designation: 'Engineering Manager',
      status: 'offline',
      joinedDate: 'Jun 2023'
    },
    // AI Agents
    {
      id: 'claude',
      name: 'Claude Assistant',
      email: 'claude@ai.assistant',
      avatar: 'CA',
      role: 'member',
      designation: 'AI Developer Assistant',
      status: 'online',
      joinedDate: 'Dec 2023'
    },
    {
      id: 'monitoring-agent',
      name: 'Monitoring Agent',
      email: 'monitoring@ai.assistant',
      avatar: 'MA',
      role: 'member',
      designation: 'AI DevOps Monitor',
      status: 'online',
      joinedDate: 'Jan 2024'
    },
    {
      id: 'devops-agent',
      name: 'DevOps Agent',
      email: 'devops@ai.assistant',
      avatar: 'DA',
      role: 'member',
      designation: 'AI Infrastructure Assistant',
      status: 'online',
      joinedDate: 'Jan 2024'
    }
  ]);

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${inviteEmail}`,
      });
      setInviteEmail("");
      setInviteMessage("");
      setShowInviteForm(false);
    }
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/invite/${channelName}/${Date.now()}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast({
      title: "Link copied",
      description: "Invite link copied to clipboard",
    });
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    toast({
      title: "Member removed",
      description: `${memberName} has been removed from the channel`,
    });
    // Add system message
    if (onSystemMessage) {
      onSystemMessage('was removed from the channel', memberName, 'user_removed');
    }
  };

  const handleMakeAdmin = (memberId: string, memberName: string) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, role: 'admin' as const } : m
    ));
    toast({
      title: "Role updated",
      description: `${memberName} is now an admin`,
    });
    // Add system message
    if (onSystemMessage) {
      onSystemMessage('was promoted to admin', memberName, 'role_changed');
    }
  };

  const handleRemoveAdmin = (memberId: string, memberName: string) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, role: 'member' as const } : m
    ));
    toast({
      title: "Role updated",
      description: `${memberName} is now a regular member`,
    });
    // Add system message
    if (onSystemMessage) {
      onSystemMessage('admin privileges were removed', memberName, 'role_changed');
    }
  };

  const handleLeaveChannel = () => {
    toast({
      title: "Left channel",
      description: `You have left #${channelName}`,
    });
    // Add system message
    if (onSystemMessage) {
      const currentMember = members.find(m => m.id === currentUserId);
      if (currentMember) {
        onSystemMessage('left the channel', currentMember.name, 'user_left');
      }
    }
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'owner':
        return (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
            Owner
          </span>
        );
      case 'admin':
        return (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
            Admin
          </span>
        );
      case 'member':
        return (
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
            Member
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={showMembersModal} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Channel Members ({members.length})
          </DialogTitle>
        </DialogHeader>

        {/* Invite Button - Moved outside of DialogTitle */}
        {isAdmin && (
          <div className="mb-4">
            <Button
              size="sm"
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="text-sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite People
            </Button>
          </div>
        )}

        {/* Invite Form */}
        {showInviteForm && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="space-y-2">
              <label className="text-sm font-medium">Invite by email</label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleInvite} size="sm">
                  Send Invite
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Share invite link</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/invite/${channelName}`}
                  className="flex-1 text-sm"
                />
                <Button 
                  onClick={handleCopyInviteLink} 
                  size="sm"
                  variant={copiedLink ? "default" : "outline"}
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {inviteEmail && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Add a message (optional)</label>
                <textarea
                  placeholder="Add a personal message to the invitation..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Members List */}
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2">
            {filteredMembers.map((member) => {
              const isCurrentUser = member.id === currentUserId;
              const isAIAgent = member.email.includes('@ai.assistant');
              const canManageMember = isAdmin && !isCurrentUser && member.role !== 'owner' && !isAIAgent;
              
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`text-xs font-semibold ${
                          isAIAgent 
                            ? "bg-orange-500 text-white" 
                            : "bg-primary text-primary-foreground"
                        }`}>
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {member.name}
                          {isCurrentUser && " (You)"}
                        </span>
                        {isAIAgent && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            Agent
                          </span>
                        )}
                        {getRoleBadge(member.role)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.designation}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Mail className="h-3 w-3" />
                        {member.email}
                        <span className="text-muted-foreground">• Joined {member.joinedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Hide for AI agents */}
                  {(canManageMember || (isCurrentUser && member.role !== 'owner')) && !isAIAgent && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1">
                        {canManageMember && (
                          <>
                            {member.role === 'admin' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sm"
                                onClick={() => handleRemoveAdmin(member.id, member.name)}
                              >
                                Remove Admin
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sm"
                                onClick={() => handleMakeAdmin(member.id, member.name)}
                              >
                                Make Admin
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-sm text-red-600 hover:text-red-700"
                              onClick={() => handleRemoveMember(member.id, member.name)}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove from Channel
                            </Button>
                          </>
                        )}
                        
                        {isCurrentUser && member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sm text-red-600 hover:text-red-700"
                            onClick={handleLeaveChannel}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Leave Channel
                          </Button>
                        )}
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer Stats */}
        <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm text-muted-foreground">
          <span>{members.filter(m => m.status === 'online').length} members online</span>
          <span>{members.filter(m => m.role === 'admin' || m.role === 'owner').length} admins</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}