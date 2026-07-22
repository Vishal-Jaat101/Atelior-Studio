'use client';

import React from 'react';

const ACCEPT_STRING = 'application/pdf,image/*,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/*';

interface IngestionDropzoneProps {
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  uploadedFiles: File[];
  handleFilesSelected: (files: FileList | File[]) => void;
  removeFile: (name: string) => void;
  getFileIcon: (type: string) => string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  tokens: any;
}

export default function IngestionDropzone({
  isDragging,
  setIsDragging,
  uploadedFiles,
  handleFilesSelected,
  removeFile,
  getFileIcon,
  fileInputRef,
  tokens
}: IngestionDropzoneProps) {
  return (
    <div className="space-y-4">
      {/* File Upload Dropzone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer bg-[#0B0D12]/40 ${
          isDragging ? 'border-[#C9A227] bg-[#C9A227]/10' : 'border-white/10 hover:border-[#C9A227]/40'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) {
            handleFilesSelected(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_STRING}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFilesSelected(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xl text-[#C9A227]">📁</span>
          <span className="text-[11px] font-mono text-[#F2F0EC] tracking-wider">
            {isDragging ? 'Release files to attach' : 'Drag & drop source documents or click to browse'}
          </span>
          <span className="text-[9px] font-mono text-[#7E7A72]">
            PDF • Images • PPTX • DOCX • Video • 3D GLB Asset References (Max 20 MB each)
          </span>
        </div>
      </div>

      {/* Selected File Chips */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {uploadedFiles.map((file) => (
            <span
              key={file.name}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono border border-[#2B4C7E]/40 bg-[#2B4C7E]/20 text-[#9BB8E5]"
            >
              <span>{getFileIcon(file.type)}</span>
              <span className="max-w-[140px] truncate text-[#F2F0EC]">{file.name}</span>
              <span className="text-[8px] text-[#7E7A72]">
                {(file.size / 1024 / 1024).toFixed(1)}MB
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                className="ml-1 hover:text-white transition-opacity text-xs font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
