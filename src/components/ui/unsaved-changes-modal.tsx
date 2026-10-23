'use client';

import React from 'react';
import { Modal, ModalBody } from './modal';
import { Button } from './button';
import { AlertTriangle, Lock } from 'lucide-react';

interface UnsavedChangesModalProps {
  open: boolean;
  isSubmitting?: boolean;
  onStay: () => void;
  onLeave: () => void;
  title?: string;
  description?: string;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  open,
  isSubmitting = false,
  onStay,
  onLeave,
  title,
  description,
}) => {
  return (
    <Modal
      open={open}
      onClose={isSubmitting ? () => {} : onStay}
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
      size="sm"
    >
      <ModalBody className="p-6 text-center">
        <div
          className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isSubmitting ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
          }`}
        >
          {isSubmitting ? (
            <Lock className="w-7 h-7 animate-pulse" />
          ) : (
            <AlertTriangle className="w-7 h-7" />
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {title || (isSubmitting ? 'Submission in Progress' : 'Unsaved Changes')}
        </h3>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          {description ||
            (isSubmitting
              ? 'Your submission is currently being processed. Leaving or refreshing the page right now may cause the operation to fail or result in incomplete data.'
              : 'You have entered details on this page. If you leave or refresh now, all your unsaved progress will be cleared.')}
        </p>

        <div className="flex flex-col gap-2.5">
          {isSubmitting ? (
            <Button
              onClick={onStay}
              variant="contained"
              color="primary"
              className="w-full py-2.5 text-sm font-semibold"
            >
              Please Wait on This Page
            </Button>
          ) : (
            <>
              <Button
                onClick={onStay}
                variant="contained"
                color="primary"
                className="w-full py-2.5 text-sm font-semibold"
              >
                Stay & Continue Editing
              </Button>
              <Button
                onClick={onLeave}
                variant="outlined"
                className="w-full py-2.5 text-sm font-medium text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                Discard & Leave
              </Button>
            </>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
};
