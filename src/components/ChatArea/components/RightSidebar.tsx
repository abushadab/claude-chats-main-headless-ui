"use client"

import { Button } from "@/components/ui/headless-button";
import { ScrollArea } from "@/components/ui/headless-scroll-area";
import { X, Image, FileText, Settings, Pin, Download, ZoomIn } from "lucide-react";

interface SharedImage {
  id: string;
  url: string;
  name: string;
  date: string;
  author: string;
}

interface SharedFile {
  id: string;
  name: string;
  size: string;
  date: string;
  author: string;
  type: 'pdf' | 'doc' | 'excel' | 'ppt' | 'code' | string;
}

interface RightSidebarProps {
  showRightSidebar: boolean;
  sidebarVisible: boolean;
  onClose: () => void;
  sharedImages: SharedImage[];
  sharedFiles: SharedFile[];
  onImageClick: (imageUrl: string) => void;
  onFileDownload: (file: SharedFile) => void;
  onShowAllImagesClick: () => void;
  onShowAllFilesClick: () => void;
  onShowPinnedMessagesClick: () => void;
  onShowChannelSettingsClick: () => void;
}

export function RightSidebar({
  showRightSidebar,
  sidebarVisible,
  onClose,
  sharedImages,
  sharedFiles,
  onImageClick,
  onFileDownload,
  onShowAllImagesClick,
  onShowAllFilesClick,
  onShowPinnedMessagesClick,
  onShowChannelSettingsClick,
}: RightSidebarProps) {
  
  if (!showRightSidebar) return null;

  const getFileTypeStyle = (type: string) => {
    switch(type) {
      case 'pdf': return 'bg-red-100 text-red-700';
      case 'doc': return 'bg-blue-100 text-blue-700';
      case 'excel': return 'bg-green-100 text-green-700';
      case 'ppt': return 'bg-orange-100 text-orange-700';
      case 'code': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getFileTypeLabel = (type: string) => {
    switch(type) {
      case 'pdf': return 'PDF';
      case 'doc': return 'DOC';
      case 'excel': return 'XLS';
      case 'ppt': return 'PPT';
      case 'code': return 'SQL';
      default: return 'FILE';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          sidebarVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div className={`ml-auto w-96 bg-background border-l border-border flex flex-col shadow-2xl relative z-10 transform transition-all duration-300 ease-out ${
        sidebarVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        {/* Sidebar Header */}
        <div className="h-[60px] border-b border-border px-4 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Shared Content</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Shared Images */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <Image className="h-4 w-4 mr-2" alt="" />
                Shared Images
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {sharedImages.slice(0, 6).map((image) => (
                  <div key={image.id} className="relative group cursor-pointer" onClick={() => onImageClick(image.url)}>
                    <img 
                      src={image.url} 
                      alt={image.name}
                      className="w-full h-20 object-cover rounded-lg border border-border group-hover:opacity-90 transition-all duration-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2 text-xs"
                onClick={onShowAllImagesClick}
              >
                View all images
              </Button>
            </div>

            {/* Shared Files */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Shared Files
              </h4>
              <div className="space-y-2">
                {sharedFiles.slice(0, 3).map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors group">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-semibold ${getFileTypeStyle(file.type)}`}>
                        {getFileTypeLabel(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{file.size} • {file.date}</div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onFileDownload(file)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2 text-xs"
                onClick={onShowAllFilesClick}
              >
                View all files
              </Button>
            </div>

            {/* Channel Settings */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Channel Settings
              </h4>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start h-8 text-sm"
                  onClick={onShowPinnedMessagesClick}
                >
                  <Pin className="h-4 w-4 mr-2" />
                  Pinned Messages
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start h-8 text-sm"
                  onClick={onShowChannelSettingsClick}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Channel Settings
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}