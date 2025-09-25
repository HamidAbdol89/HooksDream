// src/components/dialogs/UnfollowConfirmDialog.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";

interface UnfollowConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  username: string;
  isLoading?: boolean;
}

export const UnfollowConfirmDialog: React.FC<UnfollowConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  username,
  isLoading = false,
}) => {
  const { t } = useTranslation("common");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          w-full max-w-sm
          rounded-xl
          p-6
          sm:p-8
          bg-white dark:bg-gray-900
          shadow-md
          flex flex-col
          gap-5
        "
      >
       <DialogHeader className="text-center sm:text-left">
  <DialogTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
    {t("unfollowConfirm.title")}
  </DialogTitle>
  <DialogDescription className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
    {t("unfollowConfirm.description", { username })}
  </DialogDescription>
</DialogHeader>

<div className="mt-3 flex flex-row justify-between gap-2">
  <Button
    type="button"
    variant="outline"
    onClick={onClose}
    disabled={isLoading}
    className="flex-1 rounded-full px-2 py-1 text-[10px] sm:text-xs"
  >
    {t("commonv2.cancel")}
  </Button>
  <Button
    type="button"
    variant="destructive"
    onClick={onConfirm}
    disabled={isLoading}
    isLoading={isLoading}
    className="flex-1 rounded-full px-2 py-1 text-[10px] sm:text-xs"
  >
    {t("unfollowConfirm.confirm")}
  </Button>
</div>



      </DialogContent>
    </Dialog>
  );
};
