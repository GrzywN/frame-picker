<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <title>Frame Picker - AI Video Frame Extraction Tool</title>
    <meta name="description" content="Extract the best frames from your videos using AI. Upload, configure, and download high-quality video frames.">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <!-- Skip to main content link -->
    <a href="#main-content" class="sr-only sr-only--focusable">Skip to main content</a>
    
    <!-- Header -->
    <header class="card text-center" role="banner">
        <div class="container">
            <h1 class="header__title">
                <span aria-hidden="true">🎯</span>
                <span>Frame Picker</span>
            </h1>
            <p class="header__subtitle">AI-powered video frame extraction</p>
        </div>
    </header>

    <!-- Progress Steps Navigation -->
    <nav class="steps" role="navigation" aria-label="Process steps">
        <div class="container">
            <ol class="steps__list">
                <li class="step" data-step="upload">
                    <div class="step__icon" aria-hidden="true">📤</div>
                    <div class="step__label">Step 1: Upload</div>
                </li>
                <li class="step" data-step="configure">
                    <div class="step__icon" aria-hidden="true">⚙️</div>
                    <div class="step__label">Step 2: Configure</div>
                </li>
                <li class="step" data-step="processing">
                    <div class="step__icon" aria-hidden="true">🤖</div>
                    <div class="step__label">Step 3: Process</div>
                </li>
                <li class="step" data-step="results">
                    <div class="step__icon" aria-hidden="true">🎯</div>
                    <div class="step__label">Step 4: Results</div>
                </li>
            </ol>
        </div>
    </nav>

    <!-- Error Display -->
    <div id="error" class="status status--error hidden" role="alert" aria-live="polite">
        <div class="container">
            <strong><span aria-hidden="true">❌</span> Error:</strong> <span id="error-text"></span>
            <button class="btn btn--secondary" onclick="app.reset()" aria-describedby="error-text">Try Again</button>
        </div>
    </div>

    <!-- Main Content -->
    <main id="main-content" role="main" tabindex="-1">
        <div id="app" role="application" aria-label="Frame Picker Application">
            <div class="container">
                <!-- Upload Step -->
                <section id="upload-step" class="card step-content" aria-labelledby="upload-heading">
                    <h2 id="upload-heading">
                        <span aria-hidden="true">📤</span>
                        Upload Your Video
                    </h2>
                
                    <div id="upload-zone" class="upload-zone" onclick="document.getElementById('file-input').click()" 
                         role="button" tabindex="0" 
                         aria-describedby="upload-instructions" 
                         aria-label="Upload video file"
                         onkeydown="if(event.key==='Enter'||event.key===' ')document.getElementById('file-input').click()">
                        <div id="upload-idle">
                            <div class="upload__icon" aria-hidden="true">📁</div>
                            <h3>Drag & drop your video here</h3>
                            <p class="text-muted">or click to browse</p>
                            <p id="upload-instructions" class="text-small">Supports MP4, AVI, MOV, WebM (maximum file size: 100MB)</p>
                        </div>
                        
                        <div id="upload-progress" class="hidden" aria-live="polite">
                            <div class="upload__icon upload__icon--loading" aria-hidden="true">📤</div>
                            <h3>Uploading video</h3>
                            <div class="progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                                <div class="progress__bar" id="progress-bar"></div>
                            </div>
                            <p><span id="progress-text">0</span>% complete</p>
                        </div>
                    </div>
                    
                    <label for="file-input" class="sr-only">Choose video file</label>
                    <input type="file" id="file-input" accept="video/*" style="display: none;" aria-describedby="upload-instructions">
            </div>

                </section>

                <!-- Configure Step -->
                <section id="configure-step" class="card step-content hidden" aria-labelledby="configure-heading">
                    <h2 id="configure-heading">
                        <span aria-hidden="true">⚙️</span>
                        Processing Options
                    </h2>
                
                    <div id="file-info" class="status status--info hidden" role="status">
                        <strong><span aria-hidden="true">📁</span> File:</strong> <span id="file-name"></span> (<span id="file-size"></span>)
                    </div>
                
                    <form class="processing-form" role="form" aria-label="Processing options">
                        <div class="grid grid--2-col">
                            <div class="form-group">
                                <label for="mode" class="form-group__label">Processing Mode</label>
                                <select id="mode" class="form-group__select" aria-describedby="mode-help">
                                    <option value="PROFILE">Profile (Face-focused)</option>
                                    <option value="ACTION">Action (Activity-focused)</option>
                                </select>
                                <div id="mode-help" class="form-help">Choose profile for headshots or action for sports content</div>
                            </div>
                            
                            <div class="form-group">
                                <label for="quality" class="form-group__label">Processing Quality</label>
                                <select id="quality" class="form-group__select" aria-describedby="quality-help">
                                    <option value="FAST">Fast</option>
                                    <option value="BALANCED" selected>Balanced</option>
                                    <option value="BEST">Best Quality</option>
                                </select>
                                <div id="quality-help" class="form-help">Higher quality takes longer to process</div>
                            </div>
                            
                            <div class="form-group">
                                <label for="count" class="form-group__label">Number of Frames</label>
                                <select id="count" class="form-group__select" aria-describedby="count-help">
                                    <option value="1" selected>1 frame</option>
                                    <option value="3">3 frames</option>
                                    <option value="5">5 frames</option>
                                    <option value="10">10 frames</option>
                                </select>
                                <div id="count-help" class="form-help">How many best frames to extract</div>
                            </div>
                            
                            <div class="form-group">
                                <label for="sample-rate" class="form-group__label">Sample Rate</label>
                                <select id="sample-rate" class="form-group__select" aria-describedby="sample-rate-help">
                                    <option value="15">Every 15th frame</option>
                                    <option value="30" selected>Every 30th frame</option>
                                    <option value="45">Every 45th frame</option>
                                </select>
                                <div id="sample-rate-help" class="form-help">Lower numbers are more thorough but slower</div>
                            </div>
                        </div>
                    </form>
                
                    <button id="process-btn" class="btn btn--full-width" aria-describedby="process-description">
                        <span aria-hidden="true">🚀</span>
                        Start Processing
                    </button>
                    <div id="process-description" class="sr-only">Begin AI analysis of your video to extract the best frames</div>
                </section>

                <!-- Processing Step -->
                <section id="processing-step" class="card step-content hidden" aria-labelledby="processing-heading">
                    <h2 id="processing-heading">
                        <span aria-hidden="true">🤖</span>
                        Processing Video
                    </h2>
                    
                    <div class="status status--info" role="status" aria-live="polite">
                        <strong>Status:</strong> <span id="process-status">Starting...</span>
                        <div class="progress" id="process-progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="margin-top: 12px; display: none;">
                            <div class="progress__bar" id="process-progress-bar"></div>
                        </div>
                        <div id="process-message" style="margin-top: 8px; font-size: 14px; color: #ccc;" aria-live="polite"></div>
                    </div>
                </section>

                <!-- Results Step -->
                <section id="results-step" class="card step-content hidden" aria-labelledby="results-heading">
                    <h2 id="results-heading">
                        <span aria-hidden="true">🎯</span>
                        Extracted Frames
                    </h2>
                    
                    <div id="no-results" class="status status--warning hidden" role="alert">
                        <strong><span aria-hidden="true">⚠️</span> No Results:</strong> No suitable frames found. Try different settings.
                        <button class="btn btn--secondary" onclick="app.goToStep('configure')" aria-describedby="no-results">
                            Adjust Settings
                        </button>
                    </div>
                    
                    <div id="results-grid" class="results-grid" role="region" aria-label="Extracted video frames"></div>
                    
                    <div id="download-all-container" class="text-center hidden" style="margin-top: 24px;">
                        <button class="btn" onclick="app.downloadAll()" aria-describedby="download-all-help">
                            <span aria-hidden="true">📦</span>
                            Download All Frames
                        </button>
                        <div id="download-all-help" class="sr-only">Download all extracted frames as individual image files</div>
                    </div>
                </section>
            </main>

                <!-- Reset Button -->
                <div id="reset-container" class="text-center hidden" style="margin-top: 24px;">
                    <button class="btn btn--secondary" onclick="app.reset()" aria-describedby="reset-help">
                        <span aria-hidden="true">🔄</span>
                        Start Over
                    </button>
                    <div id="reset-help" class="sr-only">Clear all data and return to the upload step</div>
                </div>
            </div>
        </div>
    </main>
</body>
</html>