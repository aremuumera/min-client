'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, Video as VideoIcon, FileText, Download, ExternalLink, Paperclip } from 'lucide-react';
import { formatFileSize } from '@/utils/helper';

interface AttachmentItem {
  url: string;
  name?: string;
  type?: 'image' | 'video' | 'document' | 'pdf' | string;
  size?: number;
}

interface OfferAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: AttachmentItem[];
  title?: string;
}

export function OfferAttachmentsModal({
  isOpen,
  onClose,
  attachments = [],
  title = 'Offer Attachments',
}: OfferAttachmentsModalProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [selectedPreview, setSelectedPreview] = useState<AttachmentItem | null>(null);

  if (!isOpen) return null;

  const normalizedAttachments = (attachments || []).map((att) => {
    let type = att.type || 'document';
    const url = att.url || '';
    if (/\.(jpg|jpeg|png|gif|webp|heic|jfif)$/i.test(url) || att.type === 'image') {
      type = 'image';
    } else if (/\.(mp4|webm|mov|mkv)$/i.test(url) || att.type === 'video') {
      type = 'video';
    } else {
      type = 'document';
    }
    return { ...att, type };
  });

  const filteredAttachments = normalizedAttachments.filter((att) => {
    if (activeFilter === 'all') return true;
    return att.type === activeFilter;
  });

  const counts = {
    all: normalizedAttachments.length,
    image: normalizedAttachments.filter((a) => a.type === 'image').length,
    video: normalizedAttachments.filter((a) => a.type === 'video').length,
    document: normalizedAttachments.filter((a) => a.type === 'document').length,
  };

  return (
    <div className="fixed inset-0 z-11000 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Paperclip size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500 font-medium">
                {normalizedAttachments.length} {normalizedAttachments.length === 1 ? 'file' : 'files'} attached to this offer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All Files', count: counts.all, icon: Paperclip },
            { key: 'image', label: 'Images', count: counts.image, icon: ImageIcon },
            { key: 'video', label: 'Videos', count: counts.video, icon: VideoIcon },
            { key: 'document', label: 'Documents & PDFs', count: counts.document, icon: FileText },
          ].map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeFilter === key ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Modal Body - Attachment Grid */}
        <div className="p-6 overflow-y-auto grow">
          {filteredAttachments.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Paperclip size={36} className="mx-auto text-gray-300" />
              <p className="text-sm font-bold text-gray-600">No attachments found for this filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredAttachments.map((file, idx) => {
                const isImg = file.type === 'image';
                const isVid = file.type === 'video';

                return (
                  <div
                    key={idx}
                    className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Media Thumbnail / Preview Area */}
                    <div className="relative h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {isImg ? (
                        <img
                          src={file.url}
                          alt={file.name || 'Image attachment'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => setSelectedPreview(file)}
                        />
                      ) : isVid ? (
                        <div
                          className="w-full h-full relative flex items-center justify-center bg-black/80 cursor-pointer"
                          onClick={() => setSelectedPreview(file)}
                        >
                          <video src={file.url} className="w-full h-full object-cover opacity-70" preload="metadata" />
                          <div className="absolute w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-emerald-600 border-b-[6px] border-b-transparent ml-1" />
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <FileText size={24} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">PDF / Document</span>
                        </div>
                      )}
                    </div>

                    {/* File Information Footer */}
                    <div className="p-3 bg-white border-t border-gray-100 flex flex-col justify-between grow">
                      <div className="mb-2">
                        <p className="text-xs font-bold text-gray-900 truncate" title={file.name || 'Attachment'}>
                          {file.name || `Attachment #${idx + 1}`}
                        </p>
                        {file.size && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            {formatFileSize(file.size)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {(isImg || isVid) && (
                          <button
                            onClick={() => setSelectedPreview(file)}
                            className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                          >
                            <ExternalLink size={12} />
                            Preview
                          </button>
                        )}
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 text-center"
                        >
                          <Download size={12} />
                          View / Open
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Expanded Preview Overlay for Image/Video */}
      {selectedPreview && (
        <div className="fixed inset-0 z-12000 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="relative max-w-4xl max-h-[90vh] w-full bg-black rounded-2xl overflow-hidden flex flex-col items-center justify-center">
            <button
              onClick={() => setSelectedPreview(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <X size={20} />
            </button>

            {selectedPreview.type === 'image' ? (
              <img
                src={selectedPreview.url}
                alt={selectedPreview.name || 'Preview'}
                className="max-w-full max-h-[80vh] object-contain"
              />
            ) : (
              <video
                src={selectedPreview.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-lg"
              />
            )}

            <div className="p-4 bg-gray-900 text-white w-full text-center text-xs font-bold truncate">
              {selectedPreview.name || 'Attachment Preview'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfferAttachmentsModal;
