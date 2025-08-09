"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/headless-scroll-area";
import { Image, ZoomIn } from "lucide-react";

interface SharedImage {
  id: string;
  url: string;
  name: string;
  date: string;
  author: string;
}

interface AllImagesModalProps {
  showAllImagesModal: boolean;
  onClose: () => void;
  sharedImages: SharedImage[];
  onImageClick: (imageUrl: string) => void;
}

export function AllImagesModal({ 
  showAllImagesModal,
  onClose,
  sharedImages,
  onImageClick
}: AllImagesModalProps) {
  
  const handleImageClick = (imageUrl: string) => {
    onImageClick(imageUrl);
    onClose();
  };

  return (
    <Dialog open={showAllImagesModal} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Image className="h-5 w-5 mr-2" />
            Shared Images ({sharedImages.length})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="grid grid-cols-3 gap-4 p-2">
            {sharedImages.map((image) => (
              <div key={image.id} className="relative">
                <div 
                  className="relative group cursor-pointer" 
                  onClick={() => handleImageClick(image.url)}
                >
                  <img 
                    src={image.url} 
                    alt={image.name}
                    className="w-full h-32 object-cover rounded-lg border border-border group-hover:opacity-90 transition-all duration-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <ZoomIn className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium truncate">{image.name}</div>
                  <div className="text-xs text-muted-foreground">{image.date} • {image.author}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}