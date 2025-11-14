import React from 'react';

export type AttachmentItem = {
  fileName: string;
  description?: string;
  // allow arbitrary attachment type string (we'll offer preset options in the UI)
  fileType: string;
  blobId: string; // mock Guid/string
  uploadedBy: string;
  uploadedOn: string; // ISO
  links?: string[];
};

type Props = {
  darkMode?: boolean;
  attachmentList: AttachmentItem[];
  setAttachmentList: React.Dispatch<React.SetStateAction<AttachmentItem[]>>;
  uploadedBy?: string;
};

const AttachmentUploader: React.FC<Props> = ({ darkMode = false, attachmentList, setAttachmentList, uploadedBy = 'system' }) => {
  const [attachment, setAttachment] = React.useState<File | null>(null);
  const [attachDesc, setAttachDesc] = React.useState('');
  const [attachType, setAttachType] = React.useState<string>('Memo (Letter)');
  const [attachTypeOther, setAttachTypeOther] = React.useState<string>('');

  const onAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) setAttachment(f);
  };

  const mockBlobId = (file: File) => {
    const safeName = file.name.replace(/\s+/g, '_');
    return `${Date.now()}-${safeName}-${Math.random().toString(36).slice(2, 9)}`;
  };

  const addAttachmentToList = () => {
    if (!attachment) return alert('Select a file first');
  if (!attachType) return alert('Select file type');

    const item: AttachmentItem = {
      fileName: attachment.name,
      description: attachDesc,
  fileType: attachType === 'Other' ? (attachTypeOther || 'Other') : attachType,
      blobId: mockBlobId(attachment),
      uploadedBy: uploadedBy || 'system',
      uploadedOn: new Date().toISOString(),
      links: [],
    };
  setAttachmentList((s) => [item, ...s]);
    setAttachment(null);
    setAttachDesc('');
    setAttachType('Memo (Letter)');
    setAttachTypeOther('');
  };

  const removeAttachment = (blobId: string) => {
    setAttachmentList((s) => s.filter((a) => a.blobId !== blobId));
  };

  return (
    <div>
      <div className="flex gap-3 items-center mt-1">
        <input type="file" onChange={onAttach} className="" />
        <select value={attachType} onChange={(e) => setAttachType(e.target.value)} className="px-2 py-1 rounded-md border">
          <option value="Memo (Letter)">Memo (Letter)</option>
          <option value="Security Clearance (INSA)">Security Clearance (INSA)</option>
          <option value="Security Clearance (BRD)">Security Clearance (BRD)</option>
          <option value="Feasibility Test">Feasibility Test</option>
          <option value="Other">Other</option>
        </select>
        {attachType === 'Other' && (
          <input
            placeholder="Specify type"
            value={attachTypeOther}
            onChange={(e) => setAttachTypeOther(e.target.value)}
            className="px-2 py-1 rounded-md border"
          />
        )}
        <input placeholder="Short description" value={attachDesc} onChange={(e) => setAttachDesc(e.target.value)} className="px-2 py-1 rounded-md border flex-1" />
        <button type="button" onClick={addAttachmentToList} className="px-3 py-1 rounded-md" style={{ background: '#581c87', color: '#fff' }}>Add</button>
      </div>
      {attachment && <div className="text-xs mt-1">Selected: {attachment.name}</div>}
      {attachmentList.length > 0 && (
        <div className="mt-3 space-y-2">
          {attachmentList.map((a) => (
            <div key={a.blobId} className="flex items-center justify-between p-2 rounded-md" style={{ background: darkMode ? '#071127' : '#faf7ff' }}>
              <div>
                <div className="text-sm font-medium">{a.fileName} <span className="text-xs text-gray-400">({a.fileType})</span></div>
                {a.description && <div className="text-xs text-gray-500">{a.description}</div>}
                <div className="text-xs text-gray-400">Uploaded: {new Date(a.uploadedOn).toLocaleString()} • By: {a.uploadedBy}</div>
              </div>
              <div>
                <button type="button" onClick={() => removeAttachment(a.blobId)} className="px-2 py-1 rounded-md border">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;
