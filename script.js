// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('webcam');

    // Blue elements
    const blueCanvas = document.getElementById('blueCanvas');
    const blueCtx = blueCanvas.getContext('2d');
    const blueMaskedCanvas = document.getElementById('blueMaskedCanvas');
    const blueMaskedCtx = blueMaskedCanvas.getContext('2d');
    const blueSensitivitySlider = document.getElementById('blueSensitivity');
    const blueSensitivityValue = document.getElementById('blueSensitivityValue');
    const blueImageUpload = document.getElementById('blueImageUpload');
    const blueGallery = document.getElementById('blueGallery');

    // Red elements
    const redCanvas = document.getElementById('redCanvas');
    const redCtx = redCanvas.getContext('2d');
    const redMaskedCanvas = document.getElementById('redMaskedCanvas');
    const redMaskedCtx = redMaskedCanvas.getContext('2d');
    const redSensitivitySlider = document.getElementById('redSensitivity');
    const redSensitivityValue = document.getElementById('redSensitivityValue');
    const redImageUpload = document.getElementById('redImageUpload');
    const redGallery = document.getElementById('redGallery');

    // Yellow elements
    const yellowCanvas = document.getElementById('yellowCanvas');
    const yellowCtx = yellowCanvas.getContext('2d');
    const yellowMaskedCanvas = document.getElementById('yellowMaskedCanvas');
    const yellowMaskedCtx = yellowMaskedCanvas.getContext('2d');
    const yellowSensitivitySlider = document.getElementById('yellowSensitivity');
    const yellowSensitivityValue = document.getElementById('yellowSensitivityValue');
    const yellowImageUpload = document.getElementById('yellowImageUpload');
    const yellowGallery = document.getElementById('yellowGallery');

    // Common elements
    const cameraSelect = document.getElementById('cameraSelect');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const message = document.getElementById('message');

    let stream = null;
    let animationId = null;
    let blueSensitivity = 50;
    let redSensitivity = 50;
    let yellowSensitivity = 50;

    // Gallery state - arrays of images
    let blueImages = [];
    let redImages = [];
    let yellowImages = [];
    let blueActiveIndex = -1;
    let redActiveIndex = -1;
    let yellowActiveIndex = -1;

    // Enumerate available cameras
    async function getCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            cameraSelect.innerHTML = '';

            if (videoDevices.length === 0) {
                cameraSelect.innerHTML = '<option value="">No cameras found</option>';
                return;
            }

            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            message.textContent = `Found ${videoDevices.length} camera(s). Select one and click Start.`;
            message.style.color = '#333';
        } catch (error) {
            console.error('Error enumerating cameras:', error);
            cameraSelect.innerHTML = '<option value="">Error loading cameras</option>';
        }
    }

    // Load cameras on page load
    getCameras();

    // Update sensitivity value display for blue
    blueSensitivitySlider.addEventListener('input', function() {
        blueSensitivity = parseInt(this.value);
        blueSensitivityValue.textContent = blueSensitivity;
    });

    // Update sensitivity value display for red
    redSensitivitySlider.addEventListener('input', function() {
        redSensitivity = parseInt(this.value);
        redSensitivityValue.textContent = redSensitivity;
    });

    // Update sensitivity value display for yellow
    yellowSensitivitySlider.addEventListener('input', function() {
        yellowSensitivity = parseInt(this.value);
        yellowSensitivityValue.textContent = yellowSensitivity;
    });

    // Helper function to add images to gallery
    function addImagesToGallery(files, images, gallery, activeIndexRef, colorName) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const index = images.length;
                    images.push(img);

                    // Create thumbnail
                    const item = document.createElement('div');
                    item.className = 'gallery-item';
                    item.dataset.index = index;

                    const thumbnail = document.createElement('img');
                    thumbnail.src = event.target.result;

                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-btn';
                    removeBtn.textContent = '×';
                    removeBtn.onclick = function(e) {
                        e.stopPropagation();
                        removeImage(index, images, gallery, activeIndexRef, colorName);
                    };

                    item.appendChild(thumbnail);
                    item.appendChild(removeBtn);

                    item.onclick = function() {
                        selectImage(index, images, gallery, activeIndexRef, colorName);
                    };

                    gallery.appendChild(item);

                    // Auto-select first image
                    if (images.length === 1) {
                        selectImage(0, images, gallery, activeIndexRef, colorName);
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Helper function to select an image
    function selectImage(index, images, gallery, activeIndexRef, colorName) {
        // Update active index based on color
        if (colorName === 'blue') blueActiveIndex = index;
        else if (colorName === 'red') redActiveIndex = index;
        else if (colorName === 'yellow') yellowActiveIndex = index;

        // Update visual selection
        const items = gallery.querySelectorAll('.gallery-item');
        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        message.textContent = `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} image ${index + 1} selected`;
        message.style.color = '#28a745';
    }

    // Helper function to remove an image
    function removeImage(index, images, gallery, activeIndexRef, colorName) {
        images.splice(index, 1);

        // Rebuild gallery
        gallery.innerHTML = '';
        images.forEach((img, i) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.dataset.index = i;

            const thumbnail = document.createElement('img');
            thumbnail.src = img.src;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = '×';
            removeBtn.onclick = function(e) {
                e.stopPropagation();
                removeImage(i, images, gallery, activeIndexRef, colorName);
            };

            item.appendChild(thumbnail);
            item.appendChild(removeBtn);

            item.onclick = function() {
                selectImage(i, images, gallery, activeIndexRef, colorName);
            };

            gallery.appendChild(item);
        });

        // Update active index
        if (colorName === 'blue') {
            blueActiveIndex = blueActiveIndex >= images.length ? images.length - 1 : blueActiveIndex;
            if (blueActiveIndex >= 0) selectImage(blueActiveIndex, images, gallery, activeIndexRef, colorName);
        } else if (colorName === 'red') {
            redActiveIndex = redActiveIndex >= images.length ? images.length - 1 : redActiveIndex;
            if (redActiveIndex >= 0) selectImage(redActiveIndex, images, gallery, activeIndexRef, colorName);
        } else if (colorName === 'yellow') {
            yellowActiveIndex = yellowActiveIndex >= images.length ? images.length - 1 : yellowActiveIndex;
            if (yellowActiveIndex >= 0) selectImage(yellowActiveIndex, images, gallery, activeIndexRef, colorName);
        }
    }

    // Handle blue image upload
    blueImageUpload.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            addImagesToGallery(e.target.files, blueImages, blueGallery, blueActiveIndex, 'blue');
        }
    });

    // Handle red image upload
    redImageUpload.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            addImagesToGallery(e.target.files, redImages, redGallery, redActiveIndex, 'red');
        }
    });

    // Handle yellow image upload
    yellowImageUpload.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            addImagesToGallery(e.target.files, yellowImages, yellowGallery, yellowActiveIndex, 'yellow');
        }
    });

    // Helper function to draw image with aspect ratio preserved (cover mode)
    function drawImageCover(ctx, img, canvasWidth, canvasHeight) {
        const imgAspect = img.width / img.height;
        const canvasAspect = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspect > canvasAspect) {
            // Image is wider than canvas
            drawHeight = canvasHeight;
            drawWidth = img.width * (canvasHeight / img.height);
            offsetX = (canvasWidth - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Image is taller than canvas
            drawWidth = canvasWidth;
            drawHeight = img.height * (canvasWidth / img.width);
            offsetX = 0;
            offsetY = (canvasHeight - drawHeight) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    // Process video frames to detect colors and apply masks
    function processFrame() {
        if (!stream) return;

        // Draw current video frame to all detection canvases
        blueCtx.drawImage(video, 0, 0, blueCanvas.width, blueCanvas.height);
        redCtx.drawImage(video, 0, 0, redCanvas.width, redCanvas.height);
        yellowCtx.drawImage(video, 0, 0, yellowCanvas.width, yellowCanvas.height);

        // Get image data from all canvases
        const blueImageData = blueCtx.getImageData(0, 0, blueCanvas.width, blueCanvas.height);
        const redImageData = redCtx.getImageData(0, 0, redCanvas.width, redCanvas.height);
        const yellowImageData = yellowCtx.getImageData(0, 0, yellowCanvas.width, yellowCanvas.height);

        const blueData = blueImageData.data;
        const redData = redImageData.data;
        const yellowData = yellowImageData.data;

        // Create image data for masked canvases
        const blueMaskedImageData = blueCtx.createImageData(blueCanvas.width, blueCanvas.height);
        const redMaskedImageData = redCtx.createImageData(redCanvas.width, redCanvas.height);
        const yellowMaskedImageData = yellowCtx.createImageData(yellowCanvas.width, yellowCanvas.height);

        const blueMaskedData = blueMaskedImageData.data;
        const redMaskedData = redMaskedImageData.data;
        const yellowMaskedData = yellowMaskedImageData.data;

        // Get currently selected images from galleries
        const blueUploadedImage = blueActiveIndex >= 0 ? blueImages[blueActiveIndex] : null;
        const redUploadedImage = redActiveIndex >= 0 ? redImages[redActiveIndex] : null;
        const yellowUploadedImage = yellowActiveIndex >= 0 ? yellowImages[yellowActiveIndex] : null;

        // Draw uploaded images to masked canvases with aspect ratio preserved
        if (blueUploadedImage) {
            drawImageCover(blueMaskedCtx, blueUploadedImage, blueMaskedCanvas.width, blueMaskedCanvas.height);
        }
        if (redUploadedImage) {
            drawImageCover(redMaskedCtx, redUploadedImage, redMaskedCanvas.width, redMaskedCanvas.height);
        }
        if (yellowUploadedImage) {
            drawImageCover(yellowMaskedCtx, yellowUploadedImage, yellowMaskedCanvas.width, yellowMaskedCanvas.height);
        }

        // Get background image data
        const blueBackgroundData = blueUploadedImage
            ? blueMaskedCtx.getImageData(0, 0, blueMaskedCanvas.width, blueMaskedCanvas.height)
            : blueMaskedCtx.createImageData(blueMaskedCanvas.width, blueMaskedCanvas.height);

        const redBackgroundData = redUploadedImage
            ? redMaskedCtx.getImageData(0, 0, redMaskedCanvas.width, redMaskedCanvas.height)
            : redMaskedCtx.createImageData(redMaskedCanvas.width, redMaskedCanvas.height);

        const yellowBackgroundData = yellowUploadedImage
            ? yellowMaskedCtx.getImageData(0, 0, yellowMaskedCanvas.width, yellowMaskedCanvas.height)
            : yellowMaskedCtx.createImageData(yellowMaskedCanvas.width, yellowMaskedCanvas.height);

        // Process each pixel
        for (let i = 0; i < blueData.length; i += 4) {
            const r = blueData[i];
            const g = blueData[i + 1];
            const b = blueData[i + 2];

            // BLUE DETECTION
            const blueThreshold = blueSensitivity / 2;
            const isBlue = b > (r + blueThreshold) && b > (g + blueThreshold) && b > 100;

            // For blue detection canvas - show only blue pixels
            if (!isBlue) {
                blueData[i] = 0;
                blueData[i + 1] = 0;
                blueData[i + 2] = 0;
            }

            // For blue masked canvas - show background where blue is detected
            if (isBlue && blueUploadedImage) {
                blueMaskedData[i] = blueBackgroundData.data[i];
                blueMaskedData[i + 1] = blueBackgroundData.data[i + 1];
                blueMaskedData[i + 2] = blueBackgroundData.data[i + 2];
                blueMaskedData[i + 3] = 255;
            } else {
                blueMaskedData[i] = 0;
                blueMaskedData[i + 1] = 0;
                blueMaskedData[i + 2] = 0;
                blueMaskedData[i + 3] = 255;
            }

            // RED DETECTION
            const redThreshold = redSensitivity / 2;
            const isRed = r > (g + redThreshold) && r > (b + redThreshold) && r > 100;

            // For red detection canvas - show only red pixels
            if (!isRed) {
                redData[i] = 0;
                redData[i + 1] = 0;
                redData[i + 2] = 0;
            }

            // For red masked canvas - show background where red is detected
            if (isRed && redUploadedImage) {
                redMaskedData[i] = redBackgroundData.data[i];
                redMaskedData[i + 1] = redBackgroundData.data[i + 1];
                redMaskedData[i + 2] = redBackgroundData.data[i + 2];
                redMaskedData[i + 3] = 255;
            } else {
                redMaskedData[i] = 0;
                redMaskedData[i + 1] = 0;
                redMaskedData[i + 2] = 0;
                redMaskedData[i + 3] = 255;
            }

            // YELLOW DETECTION
            // Yellow is high red + high green, low blue
            const yellowThreshold = yellowSensitivity / 2;
            const isYellow = r > (b + yellowThreshold) &&
                           g > (b + yellowThreshold) &&
                           r > 100 && g > 100 &&
                           Math.abs(r - g) < 50; // Red and green should be similar

            // For yellow detection canvas - show only yellow pixels
            if (!isYellow) {
                yellowData[i] = 0;
                yellowData[i + 1] = 0;
                yellowData[i + 2] = 0;
            }

            // For yellow masked canvas - show background where yellow is detected
            if (isYellow && yellowUploadedImage) {
                yellowMaskedData[i] = yellowBackgroundData.data[i];
                yellowMaskedData[i + 1] = yellowBackgroundData.data[i + 1];
                yellowMaskedData[i + 2] = yellowBackgroundData.data[i + 2];
                yellowMaskedData[i + 3] = 255;
            } else {
                yellowMaskedData[i] = 0;
                yellowMaskedData[i + 1] = 0;
                yellowMaskedData[i + 2] = 0;
                yellowMaskedData[i + 3] = 255;
            }
        }

        // Put processed image data back to all canvases
        blueCtx.putImageData(blueImageData, 0, 0);
        blueMaskedCtx.putImageData(blueMaskedImageData, 0, 0);
        redCtx.putImageData(redImageData, 0, 0);
        redMaskedCtx.putImageData(redMaskedImageData, 0, 0);
        yellowCtx.putImageData(yellowImageData, 0, 0);
        yellowMaskedCtx.putImageData(yellowMaskedImageData, 0, 0);

        // Continue processing frames
        animationId = requestAnimationFrame(processFrame);
    }

    // Start webcam
    startBtn.addEventListener('click', async function() {
        try {
            const selectedDeviceId = cameraSelect.value;

            if (!selectedDeviceId) {
                message.textContent = 'Please select a camera first.';
                message.style.color = '#dc3545';
                return;
            }

            // Request access to the selected webcam
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: selectedDeviceId },
                    width: 640,
                    height: 480
                },
                audio: false
            });

            // Set video source to webcam stream
            video.srcObject = stream;

            // Wait for video to load metadata
            video.addEventListener('loadedmetadata', () => {
                // Set canvas sizes to match video
                blueCanvas.width = video.videoWidth;
                blueCanvas.height = video.videoHeight;
                blueMaskedCanvas.width = video.videoWidth;
                blueMaskedCanvas.height = video.videoHeight;

                redCanvas.width = video.videoWidth;
                redCanvas.height = video.videoHeight;
                redMaskedCanvas.width = video.videoWidth;
                redMaskedCanvas.height = video.videoHeight;

                yellowCanvas.width = video.videoWidth;
                yellowCanvas.height = video.videoHeight;
                yellowMaskedCanvas.width = video.videoWidth;
                yellowMaskedCanvas.height = video.videoHeight;

                // Start processing frames
                processFrame();
            });

            // Update UI
            startBtn.disabled = true;
            stopBtn.disabled = false;
            message.textContent = 'Webcam started - detecting blue, red, and yellow colors!';
            message.style.color = '#28a745';

            console.log('Webcam started with multi-color detection');
        } catch (error) {
            console.error('Error accessing webcam:', error);
            message.textContent = 'Error: Could not access webcam. Please make sure you granted permission.';
            message.style.color = '#dc3545';
        }
    });

    // Stop webcam
    stopBtn.addEventListener('click', function() {
        if (stream) {
            // Stop animation frame
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            stream = null;

            // Clear all canvases
            blueCtx.clearRect(0, 0, blueCanvas.width, blueCanvas.height);
            blueMaskedCtx.clearRect(0, 0, blueMaskedCanvas.width, blueMaskedCanvas.height);
            redCtx.clearRect(0, 0, redCanvas.width, redCanvas.height);
            redMaskedCtx.clearRect(0, 0, redMaskedCanvas.width, redMaskedCanvas.height);
            yellowCtx.clearRect(0, 0, yellowCanvas.width, yellowCanvas.height);
            yellowMaskedCtx.clearRect(0, 0, yellowMaskedCanvas.width, yellowMaskedCanvas.height);

            // Update UI
            startBtn.disabled = false;
            stopBtn.disabled = true;
            message.textContent = 'Webcam stopped.';
            message.style.color = '#333';

            console.log('Webcam stopped');
        }
    });

    console.log('Script loaded successfully');
});
