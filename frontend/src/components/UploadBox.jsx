export default function UploadBox({
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  file,
  setFile,
  handleUpload,
  uploadStatus,
  isUploading
}) {
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`my-5 p-6 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center ${
        isDragging
          ? "bg-indigo-900/40 border-indigo-500 scale-105"
          : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
      }`}
    >
      <div className="text-3xl mb-2">{isDragging ? '📂' : '📄'}</div>
      <h3 className="text-sm font-semibold text-white mb-1">
        {file ? file.name : "Upload your PDF"}
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        {isDragging ? "Drop it here!" : "Drag & drop or click below"}
      </p>

      <div className="flex flex-col items-center gap-3 w-full">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Browse Files
        </label>

        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={`w-full cursor-pointer mt-2 whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-colors shadow-sm ${
            file && !isUploading
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }`}
        >
          {isUploading ? "Processing..." : "Upload & Process"}
        </button>
      </div>

      {uploadStatus && (
        <p className="mt-4 text-xs font-medium text-emerald-400">{uploadStatus}</p>
      )}
    </div>
  );
}
