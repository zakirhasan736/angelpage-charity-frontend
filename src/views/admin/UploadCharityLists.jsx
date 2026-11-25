import React, { useState } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle2, FileSpreadsheet, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/elements';
// import { ToastService } from '@/components/elements/notifications/ToastService';

const UploadCharityList = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/charity/upload-charities`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const count = Array.isArray(response.data?.charities) ? response.data.charities.length : null;
      setMessage(count != null ? `Uploaded ${count} charit${count === 1 ? 'y' : 'ies'}.` : 'Charity list uploaded.');
      setFile(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.message || 'Failed to upload the file.');
    } finally {
      setLoading(false);
    }
  };

  const pick = f => {
    if (!f) return;
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      setError('Choose an Excel file (.xlsx or .xls).');
      return;
    }
    setError(null);
    setMessage(null);
    setFile(f);
  };

  return (
    <div className="upload-charity-list">
      <h3 className="font-primary text-[22px] text-[#0B0112]">Upload a charity list</h3>
      <p className="mt-1 text-[14px] text-[#6B686E]">Import charities in bulk from an Excel spreadsheet (.xlsx or .xls).</p>

      <form onSubmit={handleSubmit} className="mt-5 max-w-[560px] space-y-4">
        <label
          htmlFor="file-upload"
          onDragOver={e => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed px-6 py-10 text-center transition ${
            dragging ? 'border-[#611192] bg-[#F2E8F8]' : 'border-[#E2DCE6] bg-[#FAF8FB] hover:border-[#611192]/60 hover:bg-[#FCF7FE]'
          }`}
        >
          <input type="file" id="file-upload" accept=".xlsx, .xls" onChange={e => pick(e.target.files?.[0])} className="sr-only" />
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#611192] shadow-sm">
            <UploadCloud className="h-6 w-6" aria-hidden />
          </span>
          <span className="mt-3 text-[15px] font-medium text-[#0B0112]">
            Drop your file here or <span className="text-[#611192] underline underline-offset-2">browse</span>
          </span>
          <span className="mt-1 text-[12px] text-[#8A888C]">Excel, one charity per row</span>
        </label>

        {file ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#ECE8EE] px-4 py-3">
            <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#00775F]" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[14px] text-[#0B0112]">{file.name}</span>
            <span className="text-[12px] text-[#8A888C]">{Math.max(1, Math.round(file.size / 1024))} KB</span>
            <button type="button" onClick={() => setFile(null)} aria-label="Remove file" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F6F3F7]">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}

        <Button type="submit" disabled={loading || !file} variant="primary" className="min-w-[180px]">
          {loading ? 'Uploading…' : 'Upload list'}
        </Button>
      </form>

      {message ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-[#E6F6F2] px-4 py-3 text-[14px] text-[#00775F]" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-[#FFF1F4] px-4 py-3 text-[14px] text-[#B0002A]" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden /> {error}
        </p>
      ) : null}
    </div>
  );
};

export default UploadCharityList;
