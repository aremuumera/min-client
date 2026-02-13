
"use client";

import React, { useState, useEffect } from 'react';
import { Paperclip, Image as ImageIcon, FileText, FileSpreadsheet, File, Download } from 'lucide-react';

const ProductAttachmentTab = ({ products }: { products: any }) => {
  const { attachments = [] } = products || {};
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);

  useEffect(() => {
    if (attachments && attachments.length > 0) {
      setSelectedAttachment(attachments[0]);
    }
  }, [attachments]);

  const getFileType = (url: string) => {
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

  const getFileName = (url: string) => {
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
      <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <Paperclip className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-medium text-gray-600 mb-2">No Attachments Available</h2>
        <p className="text-gray-500 text-center max-w-md">
          There are currently no documents or files attached to this product.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <h2 className="text-2xl font-semibold mb-6 flex items-center text-gray-800">
        <Paperclip className="mr-2 w-6 h-6" />
        Product Attachments
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 border rounded-lg p-4 bg-gray-50 h-fit">
          <h3 className="text-lg font-medium mb-4 text-gray-800">Available Files</h3>
          <div className="space-y-3">
            {attachments.map((attachment: string, index: number) => {
              const fileType = getFileType(attachment);
              const fileName = getFileName(attachment);
              
              return (
                <div 
                  key={index}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-white hover:shadow-sm ${
                    selectedAttachment === attachment ? 'bg-white border-green-400 shadow-sm border' : 'bg-transparent border border-transparent'
                  }`}
                  onClick={() => setSelectedAttachment(attachment)}
                >
                  <div className="mr-3">
                    {renderFileIcon(fileType, 24)}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <p className="font-medium text-sm truncate text-gray-800">{fileName}</p>
                    <p className="text-xs text-gray-500">{fileType.toUpperCase()}</p>
                  </div>
                  <button 
                    className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(attachment);
                    }}
                    title="Download file"
                  >
                    <Download size={18} className="text-gray-600" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Preview Area */}
        <div className="lg:col-span-2 border rounded-lg p-4 bg-white flex flex-col min-h-[400px]">
          {selectedAttachment && (
            <>
              <div className="flex justify-between items-center mb-4 border-b pb-4">
                <h3 className="text-lg font-medium text-gray-800 truncate pr-4">
                  {getFileName(selectedAttachment)}
                </h3>
                 <button
                      onClick={() => handleDownload(selectedAttachment)}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                    >
                      <Download className="mr-1.5 w-4 h-4" />
                      Download
                    </button>
              </div>
              
              <div className="flex-grow rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center relative">
                {getFileType(selectedAttachment) === 'image' ? (
                   /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={selectedAttachment} 
                    alt="Product attachment" 
                    className="max-h-[500px] w-auto h-auto object-contain"
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
                      {renderFileIcon(getFileType(selectedAttachment), 72)}
                    </div>
                    <h4 className="text-xl font-medium mb-2 text-gray-800">
                      {getFileName(selectedAttachment)}
                    </h4>
                    <p className="text-gray-500 mb-6">
                      This file type cannot be previewed. Please download to view.
                    </p>
                    <button
                      onClick={() => handleDownload(selectedAttachment)}
                      className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                    >
                      <Download className="mr-2 w-5 h-5" />
                      Download File
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
