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
        className={`relative border-2 border-dashed rounded p-4 text-center transition-all cursor-pointer ${
          isDragging ? 'border-solid' : ''
        }`}
        style={{
          borderColor: isDragging ? tokens.colors.blueprint600 : tokens.colors.pencil400 + '55',
          backgroundColor: isDragging ? tokens.colors.blueprint600 + '08' : 'transparent',
        }}
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
            e.target.value = ''; // reset to allow re-selecting same file
          }}
        />
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-lg">📎</span>
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: tokens.colors.pencil400 }}>
            {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </span>
          <span className="text-[9px] font-mono" style={{ color: tokens.colors.pencil400 + 'aa' }}>
            PDF · Images · PPTX · DOCX · Video — Max 20 MB each
          </span>
        </div>
      </div>

      {/* Selected File Chips */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {uploadedFiles.map((file) => (
            <span
              key={file.name}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono border shadow-3xs"
              style={{
                backgroundColor: tokens.colors.blueprint600 + '0a',
                borderColor: tokens.colors.blueprint600 + '33',
                color: tokens.colors.blueprint600,
              }}
            >
              <span>{getFileIcon(file.type)}</span>
              <span className="max-w-[120px] truncate">{file.name}</span>
              <span className="text-[8px]" style={{ color: tokens.colors.pencil400 }}>
                {(file.size / 1024 / 1024).toFixed(1)}MB
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                className="ml-0.5 hover:opacity-70 transition-opacity text-xs leading-none"
                style={{ color: tokens.colors.pencil400 }}
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
