"use client";

import React, { useState, useEffect } from 'react';
import { Paperclip, Image as ImageIcon, FileText, FileSpreadsheet, File, Download } from 'lucide-react';

const ProductAttachmentTab = ({ products }: { products: any }) => {
  const { attachments = [] } = products || {};
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);

  useEffect(() => {
    if (attachments && attachments.length > 0) {
      const first = attachments[0];
      const initialAttachment = typeof first === 'string' ? first : (first?.url || first?.fileUrl || '');
      setSelectedAttachment(initialAttachment);
    }
  }, [attachments]);

  const getFileType = (url: any) => {
    if (!url || typeof url !== 'string') return 'other';
    const extension = url.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension || '')) {
      return 'word';
    } else if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return 'excel';
    } else {
      return 'other';
    }
  };

  const getFileName = (url: any) => {
    if (!url || typeof url !== 'string') return 'Unknown File';
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.split('?')[0];
  };

  const renderFileIcon = (fileType: string, size = 24) => {
    switch (fileType) {
      case 'image': return <ImageIcon size={size} className="text-green-700" />;
      case 'pdf': return <FileText size={size} className="text-red-500" />;
      case 'word': return <FileText size={size} className="text-blue-700" />;
      case 'excel': return <FileSpreadsheet size={size} className="text-green-600" />;
      default: return <File size={size} className="text-gray-500" />;
    }
  };

  const handleDownload = (url: string) => {
    const fileName = getFileName(url);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!attachments || attachments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <Paperclip className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-medium text-gray-600 mb-2">No Attachments Available</h2>
        <p className="text-gray-500 text-center max-w-md text-sm">
          There are currently no documents or files attached to this product.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900">
        <Paperclip className="mr-2 w-5 h-5 text-green-700" />
        Product Attachments
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 border border-gray-200 rounded-xl p-4 bg-gray-50/50 h-fit">
          <h3 className="text-base font-semibold mb-4 text-gray-900">Available Files</h3>
          <div className="space-y-2">
            {attachments.map((attachmentItem: any, index: number) => {
              const attachment = typeof attachmentItem === 'string' ? attachmentItem : (attachmentItem?.url || attachmentItem?.fileUrl || '');
              if (!attachment) return null;

              const fileType = getFileType(attachment);
              const fileName = getFileName(attachment);

              return (
                <div
                  key={index}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all border ${selectedAttachment === attachment ? 'bg-white border-green-500 text-green-800' : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'
                    }`}
                  onClick={() => setSelectedAttachment(attachment)}
                >
                  <div className="mr-3">
                    {renderFileIcon(fileType, 20)}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <p className="font-medium text-xs md:text-sm truncate text-gray-900">{fileName}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{fileType}</p>
                  </div>
                  <button
                    className="ml-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(attachment);
                    }}
                    title="Download file"
                  >
                    <Download size={16} className="text-gray-600" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2 border border-gray-200 rounded-xl p-4 bg-white flex flex-col min-h-[400px]">
          {selectedAttachment && (
            <>
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <h3 className="text-sm font-semibold text-gray-900 truncate pr-4">
                  {getFileName(selectedAttachment)}
                </h3>
                <button
                  onClick={() => handleDownload(selectedAttachment)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200/80 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Download className="mr-1.5 w-3.5 h-3.5" />
                  Download
                </button>
              </div>

              <div className="flex-grow rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center relative">
                {getFileType(selectedAttachment) === 'image' ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selectedAttachment}
                    alt="Product attachment"
                    className="max-h-[500px] w-auto h-auto object-contain p-2"
                  />
                ) : getFileType(selectedAttachment) === 'pdf' ? (
                  <iframe
                    src={`${selectedAttachment}#view=FitH`}
                    title="PDF Viewer"
                    className="w-full h-full min-h-[500px]"
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="mx-auto mb-4 flex justify-center">
                      {renderFileIcon(getFileType(selectedAttachment), 64)}
                    </div>
                    <h4 className="text-base font-semibold mb-2 text-gray-900">
                      {getFileName(selectedAttachment)}
                    </h4>
                    <button
                      onClick={() => handleDownload(selectedAttachment)}
                      className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
                    >
                      Download File to View
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductAttachmentTab;
