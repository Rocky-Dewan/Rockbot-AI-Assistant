import React, { useRef, useState } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * FileUploader
 * - Drag & drop + click to upload
 * - posts to /api/upload and calls callback with result { success, data, localUrl, name, error }
 *
 * Usage:
 * <FileUploader onUploadStart={() => {}} onUploadComplete={(result)=>{}} />
 */
export function FileUploader({ onUploadStart, onUploadComplete, className = "" }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

  async function doUpload(file) {
    if (!file) return;
    setUploading(true);
    onUploadStart && onUploadStart(file);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        onUploadComplete &&
          onUploadComplete({
            success: false,
            error: text || "Upload failed",
            localUrl: URL.createObjectURL(file),
            name: file.name,
          });
        return;
      }

      const json = await res.json();
      onUploadComplete &&
        onUploadComplete({
          success: true,
          data: json,
          localUrl: json?.url || URL.createObjectURL(file),
          name: json?.filename || file.name,
        });
    } catch (e) {
      onUploadComplete &&
        onUploadComplete({
          success: false,
          error: e?.message || String(e),
          localUrl: URL.createObjectURL(file),
          name: file.name,
        });
    } finally {
      setUploading(false);
      setDragging(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) doUpload(f);
  }

  function onPick() {
    const f = fileRef.current.files[0];
    if (f) doUpload(f);
    fileRef.current.value = "";
  }

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,image/*"
        className="hidden"
        onChange={onPick}
        aria-label="Attach file"
      />
      <Button
        onClick={() => fileRef.current && fileRef.current.click()}
        className={`flex items-center gap-2 px-3 py-2 ${dragging ? "ring-2 ring-blue-400/30" : ""}`}
        aria-label="Attach file"
      >
        <Paperclip className="w-4 h-4" />
        <span className="text-sm">Attach</span>
      </Button>
      {uploading && (
        <div className="flex items-center gap-2 text-xs opacity-80">
          <Loader2 className="w-4 h-4 animate-spin" /> uploading...
        </div>
      )}
    </div>
  );
}

export default FileUploader;
