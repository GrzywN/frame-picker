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

// Design System Components
import { Navbar } from "@/shared/ui/organisms/navbar";
import { UploadZone } from "@/shared/ui/organisms/upload-zone";
import { ProcessingStatus } from "@/shared/ui/organisms/processing-status";
import { ResultsGallery } from "@/shared/ui/organisms/results-gallery";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/shared/ui/molecules/card";
import { FormField, Select } from "@/shared/ui/molecules/form-field";
import { Button } from "@/shared/ui/atoms/button";
import { Badge } from "@/shared/ui/atoms/badge";
import { Progress } from "@/shared/ui/atoms/progress";
import { AnimatedBg } from "@/shared/ui/atoms/animated-bg";
import { BlobDecoration, OrganicShape } from "@/shared/ui/atoms/blob-decoration";
import { cn } from "@/shared/lib/utils";

type AppState = "upload" | "configure" | "processing" | "completed" | "error";

export default function HomePage() {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [appState, setAppState] = useState<AppState>("upload");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [results, setResults] = useState<FrameResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Processing options state
  const [processingOptions, setProcessingOptions] = useState<ProcessRequest>({
    mode: 'profile',
    quality: 'balanced',
    count: 1,
    sample_rate: 30,
    min_interval: 2.0,
  });

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
      setUploadProgress(0);
      setError(null);
      setUploadedFile(file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      console.log("Creating session...");
      const session = await fetch(`http://localhost:8000/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      }).then(res => res.json());
      
      setSessionId(session.session_id);
      setUploadProgress(50);

      console.log("Uploading video...");
      await apiClient.uploadVideo(session.session_id, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      console.log("Video uploaded successfully");
      setAppState("configure");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setAppState("error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleProcess = async () => {
    if (!sessionId) {
      setError("No session ID available");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      console.log("Starting processing with options:", processingOptions);
      
      const response = await fetch(`http://localhost:8000/api/sessions/${sessionId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(processingOptions),
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
      setProcessingOptions({
        mode: 'profile',
        quality: 'balanced',
        count: 1,
        sample_rate: 30,
        min_interval: 2.0,
      });
    }
  };

  const getStepProgress = (step: AppState): number => {
    const steps: AppState[] = ["upload", "configure", "processing", "completed"];
    const currentIndex = steps.indexOf(appState);
    const stepIndex = steps.indexOf(step);
    
    if (appState === "error") return stepIndex <= 0 ? 100 : 0;
    if (stepIndex < currentIndex) return 100;
    if (stepIndex === currentIndex) return 50;
    return 0;
  };

  return (
    <AnimatedBg variant="blobs" intensity="low" className="min-h-screen">
      {/* Navigation */}
      <Navbar user={user} onSignOut={() => {/* Handle sign out */}} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative">
        {/* Decorative Elements */}
        <BlobDecoration 
          size="xl" 
          color="gradient" 
          position="top-right" 
          className="opacity-10" 
        />
        
        <OrganicShape 
          variant="squiggle" 
          size="lg" 
          color="blue" 
          className="top-20 left-10 opacity-20" 
        />

        {/* Usage Stats for Authenticated Users */}
        {isAuthenticated && (
          <div className="mb-8 relative">
            <UsageStats />
            <OrganicShape 
              variant="blob2" 
              size="md" 
              color="green" 
              className="top-0 right-0 opacity-15" 
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Card variant="default" className="mb-8 bg-warning-orange/10 border-warning-orange relative overflow-hidden">
            <BlobDecoration size="lg" color="gold" position="bottom-right" className="opacity-30" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-warning-orange relative z-10">
                ❌ ERROR
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="font-mono text-body text-void-black mb-4">{error}</p>
            </CardContent>
            <CardFooter className="relative z-10">
              <Button onClick={handleReset} variant="secondary">
                🔄 TRY AGAIN
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step Indicator */}
        <AnimatedBg variant="grid" intensity="low" className="mb-8">
          <Card variant="dark" className="relative overflow-hidden">
            <BlobDecoration size="lg" color="blue" position="top-left" className="opacity-20" />
            <BlobDecoration size="md" color="purple" position="bottom-right" className="opacity-20" />
            <CardContent className="p-6 relative z-10">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { step: "upload", label: "UPLOAD", icon: "📤" },
                  { step: "configure", label: "CONFIGURE", icon: "⚙️" },
                  { step: "processing", label: "PROCESSING", icon: "🤖" },
                  { step: "completed", label: "RESULTS", icon: "🎯" },
                ].map(({ step, label, icon }, index) => {
                  const isActive = appState === step;
                  const isCompleted = getStepProgress(step as AppState) === 100;
                  const progress = getStepProgress(step as AppState);
                  
                  return (
                    <div key={step} className="text-center relative">
                      {index < 3 && (
                        <OrganicShape 
                          variant="lightning" 
                          size="sm" 
                          color="gold" 
                          className="top-1/2 -right-4 opacity-30" 
                        />
                      )}
                      <div className={cn(
                        "text-3xl mb-2 transition-all duration-300",
                        isActive && "scale-110",
                        isCompleted ? "opacity-100" : "opacity-50"
                      )}>
                        {icon}
                      </div>
                      <div className={cn(
                        "font-mono text-caption font-bold uppercase tracking-wide",
                        isActive ? "text-electric-blue" : "text-gray-200"
                      )}>
                        {label}
                      </div>
                      <div className="mt-2">
                        <Progress value={progress} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </AnimatedBg>

        {/* Main Content Based on State */}
        {appState === "upload" && (
          <div className="space-y-8 relative">
            <OrganicShape 
              variant="blob3" 
              size="lg" 
              color="green" 
              className="top-0 left-1/4 opacity-10" 
            />
            
            <UploadZone
              onUpload={handleVideoUpload}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              disabled={isUploading}
              maxSize={100 * 1024 * 1024} // 100MB
              className="relative"
            />

            {/* Info Section with Animated Background */}
            <AnimatedBg variant="waves" intensity="low">
              <Card variant="default" hover className="relative overflow-hidden">
                <BlobDecoration size="xl" color="gradient" position="center" className="opacity-5" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    🎯 HOW IT WORKS
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { step: "1", title: "Upload", desc: "Upload your video file (MP4, AVI, MOV, WebM)", color: "blue" },
                      { step: "2", title: "Configure", desc: "Choose processing mode and quality settings", color: "green" },
                      { step: "3", title: "Process", desc: "AI analyzes your video to find the best frames", color: "gold" },
                      { step: "4", title: "Download", desc: "Get high-quality extracted frames", color: "purple" },
                    ].map((item, index) => (
                      <div key={item.step} className="text-center relative">
                        <OrganicShape 
                          variant={index % 2 === 0 ? "blob1" : "blob2"} 
                          size="sm" 
                          color={item.color as any} 
                          className="top-0 right-0 opacity-20" 
                        />
                        <div className="w-12 h-12 bg-electric-blue text-void-black font-mono font-bold text-h3 flex items-center justify-center border-3 border-void-black mx-auto mb-3 relative z-10">
                          {item.step}
                        </div>
                        <h4 className="font-mono font-bold text-body uppercase mb-2 relative z-10">{item.title}</h4>
                        <p className="font-mono text-small text-gray-700 relative z-10">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="relative z-10">
                  <div className="w-full text-center">
                    {isAuthenticated ? (
                      <Badge variant={user?.tier === 'PRO' ? 'success' : 'info'} size="md">
                        {user?.tier === 'FREE' ? '3 VIDEOS/MONTH • 720P WITH WATERMARK' : '100 VIDEOS/MONTH • 1080P NO WATERMARK'}
                      </Badge>
                    ) : (
                      <div className="space-y-2">
                        <Badge variant="warning" size="md">
                          ANONYMOUS: 1 VIDEO/DAY • 720P WITH WATERMARK
                        </Badge>
                        <div>
                          <Button variant="secondary" size="sm" className="ml-2">
                            REGISTER FOR MORE
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </AnimatedBg>
          </div>
        )}

        {appState === "configure" && (
          <div className="space-y-8 relative">
            <BlobDecoration size="lg" color="purple" position="top-left" className="opacity-15" />
            
            {/* Upload Summary */}
            {uploadedFile && (
              <Card variant="default" className="relative overflow-hidden">
                <OrganicShape variant="squiggle" size="md" color="blue" className="top-0 right-0 opacity-20" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    📁 UPLOADED VIDEO
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-small">
                    <div>
                      <span className="text-gray-700 font-medium">FILE:</span>
                      <br />
                      <span className="text-void-black font-bold">{uploadedFile.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">SIZE:</span>
                      <br />
                      <span className="text-void-black font-bold">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">TYPE:</span>
                      <br />
                      <span className="text-void-black font-bold">{uploadedFile.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">SESSION:</span>
                      <br />
                      <code className="text-electric-blue bg-gray-100 px-2 py-1">
                        {sessionId?.slice(0, 8)}...
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing Options */}
            <AnimatedBg variant="particles" intensity="low">
              <Card variant="default" className="relative overflow-hidden">
                <BlobDecoration size="xl" color="gradient" position="bottom-right" className="opacity-10" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    ⚙️ PROCESSING OPTIONS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <OrganicShape variant="blob1" size="sm" color="blue" className="top-0 right-0 opacity-15" />
                      <FormField
                        label="Mode"
                        hint={processingOptions.mode === 'profile' 
                          ? 'Best for headshots and profile pictures' 
                          : 'Best for sports and action shots'}
                      >
                        <Select
                          value={processingOptions.mode}
                          onChange={(e) => setProcessingOptions(prev => ({ ...prev, mode: e.target.value as 'profile' | 'action' }))}
                          options={[
                            { value: 'profile', label: 'Profile (Face-focused)' },
                            { value: 'action', label: 'Action (Activity-focused)' },
                          ]}
                        />
                      </FormField>
                    </div>

                    <div className="relative">
                      <OrganicShape variant="blob2" size="sm" color="green" className="top-0 left-0 opacity-15" />
                      <FormField
                        label="Quality"
                        hint="Higher quality takes longer to process"
                      >
                        <Select
                          value={processingOptions.quality}
                          onChange={(e) => setProcessingOptions(prev => ({ ...prev, quality: e.target.value as 'fast' | 'balanced' | 'best' }))}
                          options={[
                            { value: 'fast', label: 'Fast (Quick processing)' },
                            { value: 'balanced', label: 'Balanced (Recommended)' },
                            { value: 'best', label: 'Best (Highest quality)' },
                          ]}
                        />
                      </FormField>
                    </div>

                    <div className="relative">
                      <OrganicShape variant="lightning" size="sm" color="gold" className="bottom-0 right-0 opacity-15" />
                      <FormField
                        label="Number of Frames"
                        hint="How many best frames to extract (1-10)"
                      >
                        <Select
                          value={processingOptions.count.toString()}
                          onChange={(e) => setProcessingOptions(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                          options={Array.from({ length: 10 }, (_, i) => ({
                            value: (i + 1).toString(),
                            label: `${i + 1} frame${i > 0 ? 's' : ''}`,
                          }))}
                        />
                      </FormField>
                    </div>

                    <div className="relative">
                      <OrganicShape variant="blob3" size="sm" color="purple" className="bottom-0 left-0 opacity-15" />
                      <FormField
                        label="Sample Rate"
                        hint="Extract every Nth frame (lower = more thorough)"
                      >
                        <Select
                          value={processingOptions.sample_rate.toString()}
                          onChange={(e) => setProcessingOptions(prev => ({ ...prev, sample_rate: parseInt(e.target.value) }))}
                          options={[
                            { value: '15', label: 'Every 15th frame (Thorough)' },
                            { value: '30', label: 'Every 30th frame (Balanced)' },
                            { value: '45', label: 'Every 45th frame (Fast)' },
                            { value: '60', label: 'Every 60th frame (Fastest)' },
                          ]}
                        />
                      </FormField>
                    </div>
                  </div>

                  {processingOptions.count > 1 && (
                    <div className="relative">
                      <BlobDecoration size="md" color="blue" position="center" className="opacity-10" />
                      <FormField
                        label="Minimum Interval (seconds)"
                        hint="Minimum time between selected frames"
                        className="relative z-10"
                      >
                        <Select
                          value={processingOptions.min_interval.toString()}
                          onChange={(e) => setProcessingOptions(prev => ({ ...prev, min_interval: parseFloat(e.target.value) }))}
                          options={[
                            { value: '1.0', label: '1.0 seconds' },
                            { value: '2.0', label: '2.0 seconds (Recommended)' },
                            { value: '3.0', label: '3.0 seconds' },
                            { value: '5.0', label: '5.0 seconds' },
                          ]}
                        />
                      </FormField>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="relative z-10">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleProcess}
                    disabled={isProcessing}
                    loading={isProcessing}
                    className="w-full"
                  >
                    🚀 START PROCESSING
                  </Button>
                </CardFooter>
              </Card>
            </AnimatedBg>
          </div>
        )}

        {(appState === "processing" || appState === "completed") && (
          <div className="space-y-8 relative">
            <BlobDecoration size="xl" color="green" position="top-right" className="opacity-10" />
            
            <ProcessingStatus status={status} sessionId={sessionId} />

            {appState === "completed" && results.length > 0 && (
              <AnimatedBg variant="blobs" intensity="medium" className="rounded-lg">
                <div className="relative">
                  <OrganicShape variant="squiggle" size="lg" color="gold" className="top-0 left-0 opacity-20" />
                  <ResultsGallery
                    results={results}
                    sessionId={sessionId!}
                    onDownload={handleDownload}
                    className="relative z-10"
                  />
                </div>
              </AnimatedBg>
            )}

            {appState === "completed" && results.length === 0 && (
              <Card variant="default" className="bg-warning-orange/10 border-warning-orange relative overflow-hidden">
                <BlobDecoration size="lg" color="gold" position="center" className="opacity-30" />
                <CardHeader className="relative z-10">
                  <CardTitle className="text-warning-orange flex items-center gap-3">
                    ⚠️ NO RESULTS
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="font-mono text-body text-void-black mb-4">
                    No suitable frames were found in your video. This might happen if:
                  </p>
                  <ul className="space-y-2 font-mono text-small text-void-black">
                    <li>• The video is very short or has limited motion</li>
                    <li>• The quality settings were too strict</li>
                    <li>• The video doesn't match the selected mode (profile/action)</li>
                  </ul>
                </CardContent>
                <CardFooter className="relative z-10">
                  <Button onClick={handleReset} variant="secondary">
                    🔄 TRY WITH DIFFERENT SETTINGS
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        )}

        {/* Reset Button */}
        {appState !== "upload" && appState !== "error" && (
          <div className="text-center mt-8 relative">
            <OrganicShape variant="blob1" size="md" color="purple" className="top-0 left-1/2 opacity-10" />
            <Button onClick={handleReset} variant="ghost" size="md" className="relative z-10">
              🔄 START OVER
            </Button>
          </div>
        )}

        {/* Footer with Animated Background */}
        <AnimatedBg variant="grid" intensity="low" className="mt-16 pt-8 rounded-lg">
          <footer className="border-t-3 border-void-black text-center relative">
            <BlobDecoration size="lg" color="gradient" position="bottom-left" className="opacity-5" />
            <div className="space-y-4 relative z-10 p-6">
              <p className="font-mono text-small text-gray-700">
                Made with ❤️ using AI • Powered by bleeding-edge technology
              </p>
              <div className="flex justify-center gap-4">
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-caption text-electric-blue hover:text-energy-green transition-colors"
                >
                  API DOCS
                </a>
                <span className="text-gray-700">•</span>
                <a
                  href="http://localhost:8000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-caption text-electric-blue hover:text-energy-green transition-colors"
                >
                  API STATUS
                </a>
                <span className="text-gray-700">•</span>
                <a
                  href="#"
                  className="font-mono text-caption text-electric-blue hover:text-energy-green transition-colors"
                >
                  DISCORD
                </a>
              </div>
            </div>
          </footer>
        </AnimatedBg>
      </main>
    </AnimatedBg>
  );
}
