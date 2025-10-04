// ArchiveConfirmDialog.tsx - Professional confirmation dialog for archiving stories
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Archive } from 'lucide-react';

interface ArchiveConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ArchiveConfirmDialog: React.FC<ArchiveConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="flex items-center justify-center sm:justify-start gap-2 text-lg">
            <Archive className="w-5 h-5 text-muted-foreground" />
            Lưu trữ Story
          </DialogTitle>
          <DialogDescription className="text-center sm:text-left mt-3">
            <div className="space-y-3">
              <p className="text-foreground">
                Bạn có muốn lưu trữ story này không? Story sẽ được chuyển vào khu vực lưu trữ và không hiển thị công khai nữa.
              </p>
              <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                <span className="text-sm text-primary flex items-center gap-2">
                  💡 <span>Bạn có thể khôi phục story này từ khu vực lưu trữ nếu chưa hết 24 giờ.</span>
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col-reverse sm:flex-row gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto h-11 text-base"
          >
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto h-11 text-base active:scale-95 transition-transform"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Đang lưu trữ...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 mr-2" />
                Lưu trữ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
