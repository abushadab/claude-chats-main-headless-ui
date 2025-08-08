"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/headless-scroll-area";
import { Button } from "@/components/ui/headless-button";
import { FileText, Download } from "lucide-react";

interface SharedFile {
  id: string;
  name: string;
  size: string;
  date: string;
  author: string;
  type: 'pdf' | 'doc' | 'excel' | 'ppt' | 'code' | string;
}

interface AllFilesModalProps {
  showAllFilesModal: boolean;
  onClose: () => void;
  sharedFiles: SharedFile[];
  onFileDownload: (file: SharedFile) => void;
}

export function AllFilesModal({ 
  showAllFilesModal,
  onClose,
  sharedFiles,
  onFileDownload
}: AllFilesModalProps) {
  
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
    <Dialog open={showAllFilesModal} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Shared Files ({sharedFiles.length})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2 p-2">
            {sharedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group border border-border">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded flex items-center justify-center text-xs font-semibold ${getFileTypeStyle(file.type)}`}>
                    {getFileTypeLabel(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{file.size} • {file.date} • {file.author}</div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3"
                  onClick={() => onFileDownload(file)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}