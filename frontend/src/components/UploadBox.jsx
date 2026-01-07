import { useState } from "react";
import api from "../api";

function UploadBox() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setLink(res.data.link); // backend should send link
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "30px" }}>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload File"}
      </button>

      {link && (
        <p>
          Download Link: <br />
          <a href={link} target="_blank">{link}</a>
        </p>
      )}
    </div>
  );
}

export default UploadBox;
