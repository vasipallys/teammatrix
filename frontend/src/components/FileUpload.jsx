import React, { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { uploadOrgFile, uploadWorkFile } from '../api'

const FileUpload = ({ type, onDataLoad }) => {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadFn = type === 'org' ? uploadOrgFile : uploadWorkFile
      const response = await uploadFn(file)

      console.log(`${type} upload response:`, response.data)

      if (response.data.success) {
        onDataLoad(response.data)
        alert(`${type === 'org' ? 'Organization' : 'Work Plan'} data loaded successfully!`)
      } else {
        alert(`Error loading data: ${response.data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="file-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={uploading}
      />
      <button
        className="upload-btn"
        onClick={() => fileInputRef.current.click()}
        disabled={uploading}
      >
        <Upload size={16} />
        {uploading ? 'Uploading...' : `Upload ${type === 'org' ? 'Organization' : 'Work Plan'} Data`}
      </button>
    </div>
  )
}

export default FileUpload