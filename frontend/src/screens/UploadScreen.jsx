import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { api } from '../services/api';

const getTokens = (darkMode) => ({
  BG: darkMode ? '#1a1a1a' : '#fbf7ef',
  CARD_BG: darkMode ? 'rgba(36,36,36,0.85)' : 'rgba(255,255,255,0.88)',
  CARD_BORDER: darkMode ? 'rgba(78,78,78,0.6)' : 'rgba(226,224,220,0.9)',
  FG: darkMode ? '#f3f3f3' : '#111827',
  FG_MUTED: darkMode ? '#a3a3a3' : '#4b5563',
});

function Spectre({ darkMode }) {
  return (
    <>
      {/* Right-side gradients */}
      <div
        style={{
          position: 'absolute',
          top: '0.5px',
          bottom: '-1.5px',
          right: 0,
          width: '756px',
          opacity: darkMode ? 0.62 : 0.8,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {/* warm amber blob */}
        <div
          style={{
            position: 'absolute',
            top: '280px',
            left: '18px',
            width: '650px',
            height: '327px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(ellipse, rgba(212,168,90,0.24) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(222,181,105,0.45) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* teal/sage blob */}
        <div
          style={{
            position: 'absolute',
            top: '465px',
            left: '-2px',
            width: '671px',
            height: '522px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(ellipse, rgba(43, 160, 132, 0.18) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(161,197,193,0.35) 0%, transparent 70%)',
            filter: 'blur(50px)',
            transform: 'rotate(-15deg)',
          }}
        />
      </div>

      {/* Left-side gradients */}
      <div
        style={{
          position: 'absolute',
          top: '0.5px',
          bottom: '-1.5px',
          left: 0,
          width: '756px',
          opacity: darkMode ? 0.5 : 0.6,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {/* warm amber blob - left upper */}
        <div
          style={{
            position: 'absolute',
            top: '120px',
            right: '18px',
            width: '600px',
            height: '300px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(ellipse, rgba(212, 168, 90, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(222, 181, 105, 0.4) 0%, transparent 70%)',
            filter: 'blur(45px)',
          }}
        />
        {/* teal/sage blob - left */}
        <div
          style={{
            position: 'absolute',
            top: '200px',
            right: '-20px',
            width: '650px',
            height: '480px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(ellipse, rgba(43, 160, 132, 0.14) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(161,197,193,0.3) 0%, transparent 70%)',
            filter: 'blur(55px)',
            transform: 'rotate(15deg)',
          }}
        />
      </div>
    </>
  );
}

export default function UploadScreen({ onUploadComplete, darkMode = false }) {
  const tokens = getTokens(darkMode);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const loadDocuments = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data.documents || []);
    } catch {
      console.error('Failed to load documents');
    }
  };

  useEffect(() => {
    const initializeDocuments = async () => {
      await loadDocuments();
    };
    initializeDocuments();
  }, []);

  const onDrop = async (acceptedFiles, fileRejections) => {
    setUploading(true);
    setUploadStatus(null);

    const messages = [];
    let successCount = 0;

    try {
      for (const rejected of fileRejections) {
        messages.push(`❌ ${rejected.file.name}: Unsupported file type`);
      }

      for (const file of acceptedFiles) {
        try {
          const result = await api.uploadFile(file);
          if (result.status === 'success') {
            successCount += 1;
            messages.push(`✅ ${file.name} uploaded`);
          } else {
            messages.push(`❌ ${file.name}: ${result.message}`);
          }
        } catch (err) {
          messages.push(`❌ ${file.name}: ${err.message || 'Upload failed'}`);
        }
      }

      if (!acceptedFiles.length && !fileRejections.length) {
        messages.push('No files selected. Please upload a PDF file.');
      }

      await loadDocuments();
      if (onUploadComplete) onUploadComplete();

      const hasErrors = messages.some((msg) => msg.startsWith('❌'));
      const headline = hasErrors
        ? `${successCount} file(s) uploaded with some issues.`
        : `All ${successCount} file(s) uploaded successfully.`;

      setUploadStatus({
        type: hasErrors ? 'error' : 'success',
        message: headline,
        details: messages,
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const handleDelete = async (filename) => {
    try {
      await api.deleteDocument(filename);
      await loadDocuments();
      if (onUploadComplete) onUploadComplete();
      setUploadStatus({ type: 'success', message: `${filename} deleted successfully.`, details: [] });
    } catch (err) {
      setUploadStatus({ type: 'error', message: `Failed to delete ${filename}.`, details: [err.message || 'Delete failed'] });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto relative" style={{ background: tokens.BG }}>
      <Spectre darkMode={darkMode} />
      {/* Header */}
      <div className="border-b px-8 py-6 relative z-10" style={{ borderColor: tokens.CARD_BORDER, background: tokens.CARD_BG }}>
        <h1 className="font-display font-bold text-3xl" style={{ color: tokens.FG }}>Upload Documents</h1>
        <p className="text-base mt-2" style={{ color: tokens.FG_MUTED }}>Add PDFs of Pakistani laws and legal texts for your research</p>
      </div>

      <div className="max-w-3xl mx-auto w-full px-8 py-8 flex-1 relative z-10">
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            uploading
              ? 'border-neutral-300 bg-neutral-100 opacity-70 cursor-not-allowed'
              : isDragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-neutral-200 hover:border-primary-300 bg-neutral-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Upload size={28} className="text-primary-600" />
          </div>
          <p className="text-neutral-900 font-semibold text-lg mb-1">
            {isDragActive ? 'Drop your PDF here' : 'Drag & drop PDF files here'}
          </p>
          <p className="text-sm text-neutral-600">or click to browse from your computer</p>
          <div className="flex gap-2 justify-center mt-6">
            <span className="text-xs bg-neutral-200 px-3 py-1.5 rounded-full text-neutral-600 font-medium">PDF</span>
          </div>
        </div>
        
        {/* Upload Status */}
        {uploading && (
          <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg text-center text-sm text-primary-700 font-medium">
            Processing... This may take a moment.
          </div>
        )}
        
        {uploadStatus && (
          <div className={`mt-6 p-4 rounded-lg text-sm font-medium ${
            uploadStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <p>{uploadStatus.message}</p>
            {uploadStatus.details?.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs font-normal">
                {uploadStatus.details.slice(0, 4).map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {/* Documents List */}
        {documents.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-neutral-900 mb-4 text-base">Your Documents ({documents.length})</h3>
            <div className="space-y-2">
              {documents.map((doc, idx) => (
                <div key={idx} className="rounded-lg border p-4 flex items-center justify-between transition-colors" style={{ background: tokens.CARD_BG, borderColor: tokens.CARD_BORDER }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText size={18} className="text-primary-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{doc.name}</p>
                      <p className="text-xs text-neutral-500">{doc.size_mb.toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.name)}
                    disabled={uploading}
                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Info Box */}
        <div className="mt-8 bg-primary-50 rounded-lg p-6 border border-primary-200">
          <p className="text-sm text-primary-900">
            <span className="font-semibold">💡 Pro tip:</span> Upload the Pakistan Penal Code, Constitution, Civil Procedure Code, Criminal Procedure Code, and Qanun-e-Shahadat for comprehensive legal research.
          </p>
        </div>
      </div>
    </div>
  );
}