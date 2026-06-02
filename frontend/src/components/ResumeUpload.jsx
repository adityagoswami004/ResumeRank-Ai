import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
export default function ResumeUpload() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setError("");
    setResult(null);
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    handleFileSelect(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_description", jobDescription);

      const response = await fetch("http://127.0.0.1:5000/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Resume parsing failed.");
      }

      setResult(data.candidate ?? data.result ?? data);
    } catch (err) {
      setError(err.message || "Something went wrong while uploading.");
    } finally {
      setLoading(false);
    }
  };

  const candidateName =
    result?.name || result?.full_name || result?.candidate_name || "N/A";
  const candidateEmail =
    result?.email || result?.mail || result?.candidate_email || "N/A";
  const candidateScore =
    result?.score ?? result?.match_score ?? result?.similarity_score ?? null;
  const candidateSkills = Array.isArray(result?.skills) ? result.skills : [];

  return (
    <div className="w-full text-white">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upload Panel */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Upload Resume</h2>
              <p className="text-sm text-white/50">
                Upload PDF or DOCX and get extracted details instantly.
              </p>
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
              isDragging
                ? "border-cyan-400 bg-cyan-400/10"
                : "border-white/15 bg-black/20"
            }`}
          >
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-cyan-300" />
            </div>

            <h3 className="text-xl font-semibold">Drag & drop resume here</h3>
            <p className="mt-2 text-sm text-white/50">
              Supported formats: PDF, DOCX, PNG, JPG, JPEG
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/15 transition"
              >
                Browse Files
              </button>

              <button
                type="button"
                onClick={handleUpload}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                {loading ? "Processing..." : "Upload Resume"}
              </button>
            </div>

            <input
  ref={fileInputRef}
  type="file"
  accept=".pdf,.docx,.png,.jpg,.jpeg"
  className="hidden"
  onChange={(e) => handleFileSelect(e.target.files?.[0])}
/>

            {file && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {file.name}
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-white/70">
              Job Description (optional)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={5}
              placeholder="Paste job description here for better matching..."
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-cyan-400"
            />
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-cyan-300" />
            <h2 className="text-2xl font-bold">Parsed Output</h2>
          </div>

          {!result ? (
            <div className="flex h-[420px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 text-center">
              <div>
                <FileText className="mx-auto mb-4 h-12 w-12 text-white/30" />
                <p className="text-white/60">
                  Upload a resume to see extracted candidate details.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-3xl bg-gradient-to-r from-indigo-500/20 via-cyan-500/10 to-fuchsia-500/20 border border-white/10 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-2xl font-bold shadow-lg shadow-cyan-500/20">
                      {candidateName !== "N/A" ? candidateName[0] : "A"}
                    </div>

                    <div>
                      <p className="text-sm text-white/40">Candidate Name</p>
                      <h3 className="mt-1 text-3xl font-bold">{candidateName}</h3>
                      <p className="mt-2 text-white/60">{candidateEmail}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="relative h-28 w-28">
                      <svg className="rotate-[-90deg]" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="10"
                          fill="none"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          stroke="#22d3ee"
                          strokeWidth="10"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray="314"
                          strokeDashoffset={
                            candidateScore !== null
                              ? 314 - (Number(candidateScore) / 100) * 314
                              : 314
                          }
                        />
                      </svg>

                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-cyan-300">
                          {candidateScore !== null ? candidateScore : 0}%
                        </span>
                        <span className="text-xs text-white/40">Match Score</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-black/20 border border-white/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Detected Skills</h3>
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300 border border-cyan-400/20">
                    {candidateSkills.length} Skills
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {candidateSkills.length > 0 ? (
                    candidateSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-200 border border-indigo-400/20 hover:scale-105 transition"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/50">No skills detected</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl bg-black/20 border border-white/10 p-5">
                  <p className="text-sm text-white/40">Resume Status</p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-emerald-300 border border-emerald-400/20">
                    <CheckCircle2 className="h-4 w-4" />
                    Successfully Parsed
                  </div>
                </div>

                <div className="rounded-3xl bg-black/20 border border-white/10 p-5">
  <p className="text-sm text-white/40">AI Status</p>

  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-cyan-300 border border-cyan-400/20">
    <Sparkles className="h-4 w-4" />
    AI Matching Enabled
  </div>
</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}