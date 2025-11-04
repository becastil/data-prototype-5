// Modal elements
const modal = document.getElementById('uploadModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModal');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const urlInput = document.getElementById('urlInput');
const urlUploadBtn = document.getElementById('urlUploadBtn');
const uploadProgress = document.getElementById('uploadProgress');
const urlProgress = document.getElementById('urlProgress');

let currentUpload = null;

// Open modal
openModalBtn.addEventListener('click', () => {
    modal.classList.add('active');
    resetUploadState();
});

// Close modal
closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    cancelUpload();
    resetUploadState();
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        cancelUpload();
        resetUploadState();
    }
});

// File input click
uploadArea.addEventListener('click', () => {
    if (!uploadProgress.style.display || uploadProgress.style.display === 'none') {
        fileInput.click();
    }
});

// File input change
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            handleFileUpload(file);
        } else {
            alert('Please upload a CSV file');
        }
    }
});

// URL upload
urlUploadBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
        handleUrlUpload(url);
    }
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const url = urlInput.value.trim();
        if (url) {
            handleUrlUpload(url);
        }
    }
});

// Cancel uploads
document.getElementById('cancelUpload')?.addEventListener('click', () => {
    cancelUpload();
    resetUploadState();
});

document.getElementById('urlCancelBtn')?.addEventListener('click', () => {
    cancelUpload();
    resetUploadState();
});

// Handle file upload
function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    uploadProgress.style.display = 'flex';
    fileInput.style.display = 'none';
    
    // Create cancelable upload
    const xhr = new XMLHttpRequest();
    currentUpload = xhr;
    
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            updateFileProgress(percent);
        }
    });
    
    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            setTimeout(() => {
                alert('File uploaded successfully!');
                resetUploadState();
                modal.classList.remove('active');
            }, 500);
        } else {
            alert('Upload failed. Please try again.');
            resetUploadState();
        }
    });
    
    xhr.addEventListener('error', () => {
        alert('Upload failed. Please try again.');
        resetUploadState();
    });
    
    xhr.open('POST', '/api/upload-csv');
    xhr.send(formData);
}

// Handle URL upload
async function handleUrlUpload(url) {
    urlProgress.style.display = 'block';
    urlUploadBtn.disabled = true;
    urlInput.disabled = true;
    
    // Simulate progress for URL upload
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 95) progress = 95;
        updateUrlProgress(Math.min(Math.round(progress), 95));
    }, 200);
    
    try {
        const response = await fetch('/api/upload-csv-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });
        
        clearInterval(progressInterval);
        updateUrlProgress(100);
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const data = await response.json();
        
        // Extract filename from URL or response
        const filename = data.filename || url.split('/').pop() || 'projectname.csv';
        document.getElementById('urlFileName').textContent = filename;
        
        setTimeout(() => {
            alert('File uploaded successfully!');
            resetUploadState();
            modal.classList.remove('active');
        }, 500);
        
    } catch (error) {
        clearInterval(progressInterval);
        alert('Upload failed. Please try again.');
        resetUploadState();
    } finally {
        urlUploadBtn.disabled = false;
        urlInput.disabled = false;
    }
}

// Update file upload progress
function updateFileProgress(percent) {
    const progressText = document.getElementById('progressPercent');
    const progressCircle = document.querySelector('.progress-ring-circle');
    
    if (progressText) {
        progressText.textContent = percent + '%';
    }
    
    if (progressCircle) {
        const circumference = 2 * Math.PI * 26;
        const offset = circumference - (percent / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }
}

// Update URL upload progress
function updateUrlProgress(percent) {
    const progressBar = document.getElementById('urlProgressBar');
    const progressPercent = document.getElementById('urlProgressPercent');
    
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
    
    if (progressPercent) {
        progressPercent.textContent = percent + '%';
    }
}

// Reset upload state
function resetUploadState() {
    uploadProgress.style.display = 'none';
    urlProgress.style.display = 'none';
    fileInput.style.display = 'none';
    fileInput.value = '';
    urlInput.value = '';
    urlUploadBtn.disabled = false;
    urlInput.disabled = false;
    updateFileProgress(0);
    updateUrlProgress(0);
    currentUpload = null;
}

// Cancel upload
function cancelUpload() {
    if (currentUpload) {
        currentUpload.abort();
        currentUpload = null;
    }
}

