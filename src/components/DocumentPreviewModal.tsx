import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
}

const DocumentPreviewModal = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
}: DocumentPreviewModalProps) => {
  const [zoom, setZoom] = useState(1);
  const [imageError, setImageError] = useState(false);

  const isImage = fileType.startsWith('image/');
  const isPdf = fileType === 'application/pdf';
  const isText = fileType.startsWith('text/') || fileType.includes('markdown');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));

  const renderPreview = () => {
    if (isImage && !imageError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg overflow-auto">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-[70vh] bg-muted/30 rounded-lg overflow-hidden">
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=0`}
            className="w-full h-full border-0"
            title={fileName}
          />
        </div>
      );
    }

    // Fallback for unsupported types or errors
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/30 rounded-lg">
        <p className="text-muted-foreground mb-4">
          Preview not available for this file type
        </p>
        <Button variant="outline" asChild>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </a>
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="truncate max-w-[60%]">{fileName}</DialogTitle>
            <div className="flex items-center gap-2">
              {isImage && !imageError && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" asChild>
                <a href={fileUrl} download={fileName}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">{renderPreview()}</div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
