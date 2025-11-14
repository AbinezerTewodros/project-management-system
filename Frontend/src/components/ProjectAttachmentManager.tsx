import React, { useState, useEffect } from 'react';
import { Paperclip, X, Download, Trash2, Upload } from 'lucide-react';
import { attachmentsService } from '@/services';
import { AttachmentReadDto } from '@/types/attachmentTypes';

interface ProjectAttachmentManagerProps {
  projectId: number;
  projectTitle: string;
  darkMode: boolean;
  onAttachmentAdded?: (attachment: AttachmentReadDto) => void;
  onAttachmentRemoved?: (attachmentId: number) => void;
}

const ProjectAttachmentManager: React.FC<ProjectAttachmentManagerProps> = ({
  projectId,
  projectTitle,
  darkMode,
  onAttachmentAdded,
  onAttachmentRemoved
}) => {
  const [attachments, setAttachments] = useState<AttachmentReadDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load existing attachments
  useEffect(() => {
    loadAttachments();
  }, [projectId]);

  const loadAttachments = async () => {
    try {
      setIsLoading(true);
      const result = await attachmentsService.list('Project', projectId.toString());
      setAttachments(result);
    } catch (error) {
      console.error('Failed to load attachments:', error);
      setError('Failed to load attachments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("entityType", "Project");
        formData.append("entityId", projectId.toString());
        formData.append("description", `Attachment for project: ${projectTitle}`);
        formData.append("tags", "[]");

        const result = await attachmentsService.upload(formData);
        
        if (result && result.length > 0) {
          const newAttachment = result[0];
          setAttachments(prev => [...prev, newAttachment]);
          onAttachmentAdded?.(newAttachment);
          console.log('✅ File uploaded successfully:', file.name);
        }
      }

      setSelectedFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAttachment = async (attachmentId: number) => {
    try {
      await attachmentsService.delete(attachmentId);
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
      onAttachmentRemoved?.(attachmentId);
      console.log('✅ Attachment deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete attachment');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'zip':
      case 'rar':
        return '📦';
      default:
        return '📎';
    }
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Paperclip className="w-5 h-5 mr-2" />
        Project Attachments
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* File Upload Area */}
      <div className="mb-6">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            darkMode ? 'border-zinc-500 bg-zinc-600' : 'border-gray-300 bg-white'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto w-8 h-8 mb-2 text-gray-400" />
          <p className="text-sm mb-2">Drag and drop files here or click to browse</p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileSelect}
            multiple
          />
          <label
            htmlFor="file-upload"
            className={`inline-block px-4 py-2 rounded-lg text-sm cursor-pointer ${
              darkMode ? 'bg-zinc-500 hover:bg-zinc-400' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Browse Files
          </label>
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    darkMode ? 'bg-zinc-600' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{getFileIcon(file.name)}</span>
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <button
                    onClick={() => removeSelectedFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={uploadFiles}
              disabled={isUploading}
              className={`mt-3 px-4 py-2 rounded-lg text-sm ${
                isUploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : darkMode
                  ? 'bg-purple-600 hover:bg-purple-500'
                  : 'bg-purple-600 hover:bg-purple-500'
              } text-white`}
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
            </button>
          </div>
        )}
      </div>

      {/* Existing Attachments */}
      <div>
        <h4 className="text-sm font-medium mb-3">Existing Attachments:</h4>
        {isLoading ? (
          <div className="text-center py-4">Loading attachments...</div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No attachments yet</div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={`flex items-center justify-between p-3 rounded ${
                  darkMode ? 'bg-zinc-600' : 'bg-white'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-2">{getFileIcon(attachment.fileName)}</span>
                  <div>
                    <div className="text-sm font-medium">{attachment.fileName}</div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(attachment.fileSize)} • {attachment.uploadedAt}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open(attachment.url, '_blank')}
                    className="text-blue-500 hover:text-blue-700"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAttachment(attachment.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectAttachmentManager;
