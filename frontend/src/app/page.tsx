"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import { UsageStats } from "@/features/auth/components/usage-stats";
import {
  apiClient,
  ProcessRequest,
  SessionStatus,
  FrameResult,
} from "@/lib/api";
import { VideoUpload } from "@/features/upload/video-upload";
import { ProcessingOptions } from "@/features/processing/processing-options";
import { ProcessingStatus } from "@/features/status/processing-status";
import { ResultsGallery } from "@/features/results/results-gallery";

type AppState = "upload" | "configure" | "processing" | "completed" | "error";

export default function HomePage() {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [appState, setAppState] = useState<AppState>("upload");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [results, setResults] = useState<FrameResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Enhanced API client with auth
  const getAuthHeaders = () => {
    return accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
  };

  // Polling for status updates
  useEffect(() => {
    if (!sessionId || appState !== "processing") return;

    const pollStatus = async () => {
      try {
        const statusData = await apiClient.getSessionStatus(sessionId);
        setStatus(statusData);

        if (statusData.status === "completed") {
          setAppState("completed");
          setIsProcessing(false);

          try {
            const resultsData = await apiClient.getResults(sessionId);
            setResults(resultsData);
          } catch (resultsError) {
            console.error("Failed to fetch results:", resultsError);
            setError("Failed to fetch results");
          }
        } else if (statusData.status === "failed") {
          setAppState("error");
          setIsProcessing(false);
          setError(statusData.error || "Processing failed");
        }
      } catch (err) {
        console.error("Failed to poll status:", err);
        setError("Failed to get processing status");
        setAppState("error");
        setIsProcessing(false);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    pollStatus();

    return () => clearInterval(interval);
  }, [sessionId, appState]);

  const handleVideoUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadedFile(file);

      // Create session with auth headers
      console.log("Creating session...");
      const session = await fetch(`http://localhost:8000/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      }).then(res => res.json());
      
      setSessionId(session.session_id);
      console.log("Session created:", session.session_id);

      // Upload video
      console.log("Uploading video...");
      await apiClient.uploadVideo(session.session_id, file);
      console.log("Video uploaded successfully");

      setAppState("configure");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setAppState("error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcess = async (options: ProcessRequest) => {
    if (!sessionId) {
      setError("No session ID available");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      console.log("Starting processing with options:", options);
      
      const response = await fetch(`http://localhost:8000/api/sessions/${sessionId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Processing failed");
      }

      console.log("Processing started");
      setAppState("processing");
    } catch (err) {
      console.error("Processing error:", err);
      setError(err instanceof Error ? err.message : "Processing failed");
      setAppState("error");
      setIsProcessing(false);
    }
  };

  const handleDownload = (
    sessionId: string,
    frameIndex: number,
    filename?: string
  ) => {
    try {
      const url = apiClient.getDownloadUrl(sessionId, frameIndex);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `frame_${frameIndex + 1}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download frame");
    }
  };

  const handleReset = async () => {
    try {
      if (sessionId) {
        console.log("Cleaning up session:", sessionId);
        await apiClient.cleanupSession(sessionId);
      }
    } catch (err) {
      console.error("Cleanup error:", err);
    } finally {
      setAppState("upload");
      setSessionId(null);
      setStatus(null);
      setResults([]);
      setError(null);
      setIsUploading(false);
      setIsProcessing(false);
      setUploadedFile(null);
    }
  };

  const getStepOpacity = (step: AppState): number => {
    const steps: AppState[] = [
      "upload",
      "configure", 
      "processing",
      "completed",
    ];
    const currentIndex = steps.indexOf(appState);
    const stepIndex = steps.indexOf(step);

    if (appState === "error") {
      return stepIndex <= 0 ? 1 : 0.3;
    }

    return stepIndex <= currentIndex ? 1 : 0.4;
  };

  return (
    <main className="container">
      {/* Header */}
      <nav>
        <ul>
          <li>
            <strong>🎬 Frame Picker</strong>
          </li>
        </ul>
        <ul>
          <li>
            {isAuthenticated ? (
              <a href="/dashboard" style={{ marginRight: '1rem' }}>
                👤 Dashboard
              </a>
            ) : (
              <>
                <a href="/auth/login" style={{ marginRight: '1rem' }}>
                  🔑 Login
                </a>
                <a href="/auth/register">
                  🆕 Register
                </a>
              </>
            )}
          </li>
        </ul>
      </nav>

      {/* Usage Stats for Authenticated Users */}
      {isAuthenticated && (
        <div style={{ marginBottom: '2rem' }}>
          <UsageStats />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <article
          style={{
            backgroundColor: "#f8d7da",
            borderColor: "#f5c6cb",
            color: "#721c24",
            marginBottom: "2rem",
          }}
        >
          <header>
            <strong>❌ Error</strong>
          </header>
          <p>{error}</p>
          <footer>
            <button onClick={handleReset} className="outline">
              🔄 Try Again
            </button>
          </footer>
        </article>
      )}

      {/* Step Indicator */}
      <div style={{ marginBottom: "2rem" }}>
        <nav aria-label="breadcrumb">
          <ul
            style={{
              display: "flex",
              listStyle: "none",
              padding: 0,
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <li
              style={{
                opacity: getStepOpacity("upload"),
                fontWeight: appState === "upload" ? "bold" : "normal",
              }}
            >
              <span>1️⃣ Upload</span>
            </li>
            <li
              style={{
                opacity: getStepOpacity("configure"),
                fontWeight: appState === "configure" ? "bold" : "normal",
              }}
            >
              <span>2️⃣ Configure</span>
            </li>
            <li
              style={{
                opacity: getStepOpacity("processing"),
                fontWeight: appState === "processing" ? "bold" : "normal",
              }}
            >
              <span>3️⃣ Processing</span>
            </li>
            <li
              style={{
                opacity: getStepOpacity("completed"),
                fontWeight: appState === "completed" ? "bold" : "normal",
              }}
            >
              <span>4️⃣ Results</span>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content Based on State */}
      {appState === "upload" && (
        <section>
          <VideoUpload
            onUpload={handleVideoUpload}
            isUploading={isUploading}
            disabled={isUploading}
          />

          {/* Info Section */}
          <article style={{ marginTop: "2rem" }}>
            <header>🎯 How it works</header>
            <ol>
              <li>
                <strong>Upload</strong> your video (MP4, AVI, MOV, WebM)
              </li>
              <li>
                <strong>Configure</strong> processing options (mode, quality,
                count)
              </li>
              <li>
                <strong>Process</strong> using AI to find the best frames
              </li>
              <li>
                <strong>Download</strong> high-quality extracted frames
              </li>
            </ol>
            <footer>
              <small>
                {isAuthenticated ? (
                  <span>
                    <strong>Authenticated:</strong> {user?.tier === 'FREE' ? '3 videos/month' : '100 videos/month'}, 
                    {user?.tier === 'FREE' ? ' 720p with watermark' : ' 1080p no watermark'}
                  </span>
                ) : (
                  <span>
                    <strong>Anonymous:</strong> 1 video/day, 720p with watermark. 
                    <a href="/auth/register" style={{ marginLeft: '0.5rem' }}>
                      Register for more!
                    </a>
                  </span>
                )}
              </small>
            </footer>
          </article>
        </section>
      )}

      {/* Rest of the component remains the same... */}
      {appState === "configure" && (
        <section>
          {/* Upload Summary */}
          {uploadedFile && (
            <article style={{ marginBottom: "2rem" }}>
              <header>📁 Uploaded Video</header>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <strong>File:</strong> {uploadedFile.name}
                </div>
                <div>
                  <strong>Size:</strong>{" "}
                  {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                </div>
                <div>
                  <strong>Type:</strong> {uploadedFile.type}
                </div>
                <div>
                  <strong>Session:</strong>{" "}
                  <code style={{ fontSize: "0.8rem" }}>
                    {sessionId?.slice(0, 8)}...
                  </code>
                </div>
              </div>
            </article>
          )}

          <ProcessingOptions
            onProcess={handleProcess}
            isProcessing={isProcessing}
            disabled={isProcessing}
          />
        </section>
      )}

      {(appState === "processing" || appState === "completed") && (
        <section>
          <ProcessingStatus status={status} sessionId={sessionId} />

          {appState === "completed" && results.length > 0 && (
            <div style={{ marginTop: "2rem" }}>
              <ResultsGallery
                results={results}
                sessionId={sessionId!}
                onDownload={handleDownload}
              />
            </div>
          )}

          {appState === "completed" && results.length === 0 && (
            <article style={{ marginTop: "2rem" }}>
              <header>⚠️ No Results</header>
              <p>
                No suitable frames were found in your video. This might happen
                if:
              </p>
              <ul>
                <li>The video is very short or has limited motion</li>
                <li>The quality settings were too strict</li>
                <li>
                  The video doesn't match the selected mode (profile/action)
                </li>
              </ul>
              <footer>
                <button onClick={handleReset} className="outline">
                  🔄 Try with different settings
                </button>
              </footer>
            </article>
          )}
        </section>
      )}

      {/* Reset Button */}
      {appState !== "upload" && appState !== "error" && (
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <button onClick={handleReset} className="secondary outline">
            🔄 Start Over
          </button>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: "3rem",
          textAlign: "center",
          fontSize: "0.9rem",
          opacity: 0.7,
          borderTop: "1px solid #eee",
          paddingTop: "2rem",
        }}
      >
        <p>
          Made with ❤️ using AI •
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: "0.5rem" }}
          >
            API Docs
          </a>{" "}
          •
          <a
            href="http://localhost:8000"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: "0.5rem" }}
          >
            API Status
          </a>
        </p>
      </footer>
    </main>
  );
}
