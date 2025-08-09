class App {
  constructor() {
    this.step = 'upload';
    this.sessionId = null;
    this.file = null;
    this.results = [];
    this.uploading = false;
    this.processing = false;
    this.init();
  }

  init() {
    const fileInput = document.getElementById('file-input');
    fileInput.onchange = e => this.handleFileSelect(e);

    const zone = document.getElementById('upload-zone');
    zone.ondragover = e => this.dragOver(e);
    zone.ondragleave = e => this.dragLeave(e);
    zone.ondrop = e => this.drop(e);
    
    // Add keyboard support for upload zone
    zone.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    };

    document.getElementById('process-btn').onclick = () => this.startProcessing();
    
    // Add keyboard navigation for results
    this.setupKeyboardNavigation();
    
    this.updateUI();
  }

  setupKeyboardNavigation() {
    // Handle escape key to reset
    document.onkeydown = (e) => {
      if (e.key === 'Escape' && this.step !== 'upload') {
        const resetContainer = document.getElementById('reset-container');
        if (!resetContainer.classList.contains('hidden')) {
          this.reset();
        }
      }
    };
  }

  dragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('upload-zone--dragover');
  }

  dragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('upload-zone--dragover');
  }

  drop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('upload-zone--dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) this.handleFile(files[0]);
  }

  handleFileSelect(e) {
    if (e.target.files.length > 0) this.handleFile(e.target.files[0]);
  }

  async handleFile(file) {
    if (!file.type.startsWith('video/')) {
      this.showError('Please select a video file');
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
      this.showError('File must be under 100MB');
      return;
    }

    this.file = file;
    await this.upload(file);
  }

  async upload(file) {
    this.uploading = true;
    this.updateUpload();
    this.hideError();

    try {
      let progress = 0;
      const interval = setInterval(() => {
        progress = Math.min(progress + 10, 90);
        this.updateProgress(progress);
      }, 200);

      const sessionRes = await fetch('http://localhost:8000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!sessionRes.ok) throw new Error('Failed to create session');
      const session = await sessionRes.json();
      this.sessionId = session.session_id;

      const formData = new FormData();
      formData.append('video', file);
      
      const uploadRes = await fetch(`http://localhost:8000/api/sessions/${this.sessionId}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      clearInterval(interval);
      this.updateProgress(100);
      
      setTimeout(() => {
        this.goTo('configure');
        this.uploading = false;
        this.updateUpload();
      }, 500);

    } catch (err) {
      this.showError(err.message);
      this.uploading = false;
      this.updateUpload();
    }
  }

  async startProcessing() {
    this.processing = true;
    this.hideError();

    try {
      const options = {
        mode: document.getElementById('mode').value,
        quality: document.getElementById('quality').value,
        count: parseInt(document.getElementById('count').value),
        sample_rate: parseInt(document.getElementById('sample-rate').value),
        min_interval: 2.0
      };

      const res = await fetch(`http://localhost:8000/api/sessions/${this.sessionId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      if (!res.ok) throw new Error('Processing failed');
      
      this.goTo('processing');
      this.poll();

    } catch (err) {
      this.showError(err.message);
      this.processing = false;
    }
  }

  async poll() {
    try {
      const res = await fetch(`http://localhost:8000/api/sessions/${this.sessionId}/status`);
      const status = await res.json();
      
      document.getElementById('process-status').textContent = status.status;
      
      if (status.progress !== undefined) {
        const bar = document.getElementById('process-progress-bar');
        const container = document.getElementById('process-progress');
        container.style.display = 'block';
        bar.style.width = `${status.progress}%`;
      }

      if (status.message) {
        document.getElementById('process-message').textContent = status.message;
      }

      if (status.status === 'completed') {
        await this.fetchResults();
        this.goTo('results');
        this.processing = false;
        return;
      }
      
      if (status.status === 'failed') {
        this.showError(status.error || 'Processing failed');
        this.processing = false;
        return;
      }

      setTimeout(() => this.poll(), 2000);
    } catch (err) {
      this.showError('Failed to get status');
      this.processing = false;
    }
  }

  async fetchResults() {
    try {
      const res = await fetch(`http://localhost:8000/api/sessions/${this.sessionId}/results`);
      this.results = await res.json();
      this.renderResults();
    } catch (err) {
      this.showError('Failed to fetch results');
    }
  }

  renderResults() {
    const container = document.getElementById('results-grid');
    const noResults = document.getElementById('no-results');
    const downloadAll = document.getElementById('download-all-container');

    if (this.results.length === 0) {
      noResults.classList.remove('hidden');
      downloadAll.classList.add('hidden');
      return;
    }

    noResults.classList.add('hidden');
    downloadAll.classList.remove('hidden');

    container.innerHTML = this.results.map((result, index) => `
      <div class="result-item" tabindex="0" role="button" 
           aria-label="Extracted frame ${index + 1}, click to download"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();app.download(${index})}"
           onclick="app.download(${index})">
        <img class="result-item__image" 
             src="${this.frameUrl(result)}" 
             alt="Extracted video frame ${index + 1} at ${result.timestamp?.toFixed(1) || 'unknown'} seconds" 
             loading="lazy">
        <div class="result-item__overlay">
          <button class="btn" onclick="event.stopPropagation();app.download(${index})" 
                  aria-describedby="download-help-${index}">
            <span aria-hidden="true">📥</span> Download
          </button>
          <div id="download-help-${index}" class="sr-only">
            Download frame ${index + 1} as JPEG image
          </div>
        </div>
      </div>
    `).join('');
  }

  frameUrl(result) {
    return `http://localhost:8000${result.download_url}`;
  }

  download(index) {
    const result = this.results[index];
    const url = this.frameUrl(result);
    const link = document.createElement('a');
    link.href = url;
    link.download = `frame_${index + 1}.jpg`;
    link.click();
  }

  downloadAll() {
    this.results.forEach((result, index) => {
      setTimeout(() => this.download(index), index * 500);
    });
  }

  goTo(step) {
    this.step = step;
    this.updateUI();
  }

  updateUI() {
    // Update steps with ARIA states
    document.querySelectorAll('.step').forEach(el => {
      const stepName = el.dataset.step;
      el.classList.remove('step--active', 'step--completed');
      
      if (stepName === this.step) {
        el.classList.add('step--active');
        el.setAttribute('aria-current', 'step');
      } else {
        el.removeAttribute('aria-current');
        if (this.completed(stepName)) {
          el.classList.add('step--completed');
          el.setAttribute('aria-label', `Step completed: ${el.querySelector('.step__label').textContent}`);
        }
      }
    });

    // Show/hide content with focus management
    document.querySelectorAll('.step-content').forEach(el => {
      el.classList.add('hidden');
      el.setAttribute('aria-hidden', 'true');
    });
    
    const activeEl = document.getElementById(`${this.step}-step`);
    if (activeEl) {
      activeEl.classList.remove('hidden');
      activeEl.setAttribute('aria-hidden', 'false');
      
      // Set focus to main heading of new step
      const heading = activeEl.querySelector('h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        setTimeout(() => heading.focus(), 100);
      }
    }

    // Reset button
    const resetBtn = document.getElementById('reset-container');
    if (this.step !== 'upload') {
      resetBtn.classList.remove('hidden');
    } else {
      resetBtn.classList.add('hidden');
    }

    // File info with better announcement
    if (this.step === 'configure' && this.file) {
      const fileInfo = document.getElementById('file-info');
      document.getElementById('file-name').textContent = this.file.name;
      document.getElementById('file-size').textContent = this.size(this.file.size);
      fileInfo.classList.remove('hidden');
      
      // Announce file upload success
      fileInfo.setAttribute('aria-live', 'polite');
      fileInfo.setAttribute('role', 'status');
    }

    // Update page title to reflect current step
    const stepTitles = {
      upload: 'Frame Picker - AI Video Frame Extraction Tool',
      configure: 'Configure Processing - Frame Picker', 
      processing: 'Processing Video - Frame Picker',
      results: 'View Results - Frame Picker'
    };
    document.title = stepTitles[this.step] || 'Frame Picker - AI Video Frame Extraction Tool';
  }

  updateUpload() {
    const idle = document.getElementById('upload-idle');
    const progress = document.getElementById('upload-progress');
    
    if (this.uploading) {
      idle.classList.add('hidden');
      progress.classList.remove('hidden');
    } else {
      idle.classList.remove('hidden');
      progress.classList.add('hidden');
    }
  }

  updateProgress(progress) {
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    const progressContainer = document.querySelector('.progress[role="progressbar"]');
    
    bar.style.width = `${progress}%`;
    text.textContent = progress;
    
    // Update ARIA progress attributes
    if (progressContainer) {
      progressContainer.setAttribute('aria-valuenow', progress);
      progressContainer.setAttribute('aria-label', `Upload progress: ${progress}%`);
    }
  }

  completed(step) {
    const steps = ['upload', 'configure', 'processing', 'results'];
    const current = steps.indexOf(this.step);
    const index = steps.indexOf(step);
    return index < current;
  }

  size(bytes) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  showError(msg) {
    const el = document.getElementById('error');
    const text = document.getElementById('error-text');
    
    text.textContent = msg;
    el.classList.remove('hidden');
    
    // Announce error to screen readers
    el.setAttribute('aria-live', 'assertive');
    
    // Focus the error for screen readers
    setTimeout(() => {
      el.focus();
    }, 100);
  }

  hideError() {
    document.getElementById('error').classList.add('hidden');
  }

  async reset() {
    if (this.sessionId) {
      try {
        await fetch(`http://localhost:8000/api/sessions/${this.sessionId}`, { 
          method: 'DELETE' 
        });
      } catch (err) {
        console.warn('Cleanup failed:', err);
      }
    }

    this.step = 'upload';
    this.sessionId = null;
    this.file = null;
    this.results = [];
    this.uploading = false;
    this.processing = false;
    
    this.hideError();
    this.updateUI();
    this.updateUpload();
    
    // Reset form
    document.getElementById('mode').value = 'profile';
    document.getElementById('quality').value = 'balanced';
    document.getElementById('count').value = '1';
    document.getElementById('sample-rate').value = '30';
  }
}

window.app = new App();