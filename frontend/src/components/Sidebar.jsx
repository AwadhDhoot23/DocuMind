import UploadBox from './UploadBox';

export default function Sidebar({
  documents,
  currentNamespace,
  setCurrentNamespace,
  handleDelete,
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
    <div className="w-80 bg-black text-slate-300 flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl flex justify-center font-extrabold text-white flex items-center gap-2">
           DocuMind
        </h1>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <h3 className="text-xs font-bold text-slate-500 mb-4 tracking-wider uppercase">Your Documents</h3>

        <div className="flex flex-col gap-2">
          {documents.length === 0 && <p className="text-sm text-slate-500 italic">No documents yet.</p>}

          {documents.map((docName, idx) => (
            <button
              key={docName}
              onClick={() => { setCurrentNamespace(docName) }}
              className={`flex cursor-pointer items-center justify-between text-left w-65 text-sm px-4 py-3 rounded-lg truncate transition-colors group ${
                currentNamespace === docName 
                  ? "bg-linear-to-r from-neutral-900 via-neutral-700 to-neutral-600 l-600 text-white font-medium" 
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className='truncate w-60'>📄 {docName} </span>
              <span
                onClick={(e) => handleDelete(docName, e)}
                className="cursor-pointer opacity-0 right-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all px-2 py-1"
                title="Delete Document"
              >
                🗑️
              </span>
            </button>
          ))}

          <UploadBox 
            isDragging={isDragging}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            file={file}
            setFile={setFile}
            handleUpload={handleUpload}
            uploadStatus={uploadStatus}
            isUploading={isUploading}
          />
        </div>
      </div>
    </div>
  );
}
