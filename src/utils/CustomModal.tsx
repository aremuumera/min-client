'use client';

import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Box } from '@/components/ui/box';
import { IconButton } from '@/components/ui/icon-button';
import { Typography } from '@/components/ui/typography';
import { X as CloseIcon } from '@phosphor-icons/react/dist/ssr/X';

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const CustomModal = ({ open, onClose, title, children }: CustomModalProps) => {
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="relative">
        {/* <IconButton
          aria-label="Close modal"
          onClick={onClose}
          className="absolute top-2 right-2 z-10"
        >
          <CloseIcon />
        </IconButton> */}
        {title && (
          <ModalHeader className="text-center pr-10">
            {title}
          </ModalHeader>
        )}
        <ModalBody className="max-h-[90vh] overflow-y-auto">
          {children}
        </ModalBody>
      </div>
    </Modal>
  );
};

export default CustomModal;
