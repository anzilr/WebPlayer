document.addEventListener('DOMContentLoaded', async function () {
    const videoPlayer = document.getElementById('videoPlayer');
    const subtitleId = document.getElementById('subtitle_id').textContent.trim();
    const index = document.getElementById('index').textContent.trim();
    const loadingMessage = document.getElementById('loadingMessage');
    const subtitleList = document.getElementById('subtitleList');
    const chooseFileButton = document.getElementById('chooseFileButton');
    const volumeControl = document.getElementById('volume');
    const rewindButton = document.getElementById('rewind');
    const previousSubtitleButton = document.getElementById('previousSubtitle');
    const nextSubtitleButton = document.getElementById('nextSubtitle');
    const fastForwardButton = document.getElementById('fastForward');
    const syncSubtitlesButton = document.getElementById('syncSubtitlesButton');
    const playPauseButton = document.getElementById('playPauseButton');
    const editPopup = document.getElementById('editPopup');
    const editSubtitleText = document.getElementById('editSubtitleText');
    const submitEditButton = document.getElementById('submitEditButton');
    const closePopupButton = document.getElementById('closePopupButton');
    const copyTimeButton = document.getElementById('copyTimeButton');
    const skipToSubtitleButton = document.getElementById('skipToSubtitleButton');
    

    let subtitles = [];

    function showLoadingMessage() {
        loadingMessage.style.display = 'flex';
    }

    function hideLoadingMessage() {
        loadingMessage.style.display = 'none';
    }

    // Function to fetch subtitle data from the backend API
    async function fetchSubtitles(subtitleId) {
        showLoadingMessage();
        try {
            const response = await fetch(`/subtitles/${subtitleId}`);
            console.log("API Response Status:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("Fetched Subtitle Data:", data);
                hideLoadingMessage();
                return data;
            } else {
                console.error('Failed to fetch subtitle data. Status:', response.status);
                hideLoadingMessage();
                return [];
            }
        } catch (error) {
            console.error('Error fetching subtitles:', error);
            hideLoadingMessage();
            return [];
        }
    }

    // Function to convert SRT time to seconds
    function convertSRTtoSeconds(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':');
        const [secs, ms] = seconds.split(',');
        return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + parseInt(ms) / 1000;
    }


    // Function to sync and display subtitles
    function syncSubtitles(subtitles) {
        videoPlayer.addEventListener('timeupdate', () => {
            const currentTime = videoPlayer.currentTime;
            const subtitleDisplay = document.getElementById('subtitleDisplay');

            let subtitleText = '';
            subtitles.forEach((subtitle, index) => {
                const startTime = convertSRTtoSeconds(subtitle.start_time);
                const endTime = convertSRTtoSeconds(subtitle.end_time);

                if (currentTime >= startTime && currentTime <= endTime) {
                    subtitleText = subtitle.edited ? subtitle.edited : subtitle.original;
                    subtitleText = subtitleText.replace(/\n/g, '<br>');

                    // Clear previous positioning styles
                    subtitleDisplay.style.top = '';
                    subtitleDisplay.style.bottom = '';
                    subtitleDisplay.style.left = '';
                    subtitleDisplay.style.right = '';
                    subtitleDisplay.style.textAlign = 'center';

                    // Apply new positioning based on tags
                    if (subtitleText.includes("{\\an8}")) {
                        subtitleText = subtitleText.replace(/{\\.*?}/g, ''); // Remove tags
                        subtitleDisplay.style.top = '10px';
                        subtitleDisplay.style.bottom = 'auto';
                    } else if (subtitleText.includes("{\\an1}")) {
                        subtitleText = subtitleText.replace(/{\\.*?}/g, ''); // Remove tags
                        subtitleDisplay.style.bottom = '10px';
                        subtitleDisplay.style.top = 'auto';
                        subtitleDisplay.style.textAlign = 'left';
                    } else if (subtitleText.includes("{\\an9}")) {
                        subtitleText = subtitleText.replace(/{\\.*?}/g, ''); // Remove tags
                        subtitleDisplay.style.top = '10px';
                        subtitleDisplay.style.bottom = 'auto';
                        subtitleDisplay.style.textAlign = 'right';
                    } else if (subtitleText.includes("{\\an7}")) {
                        subtitleText = subtitleText.replace(/{\\.*?}/g, ''); // Remove tags
                        subtitleDisplay.style.top = '10px';
                        subtitleDisplay.style.bottom = 'auto';
                        subtitleDisplay.style.textAlign = 'left';
                    } else if (subtitleText.includes("{\\an3}")) {
                        subtitleText = subtitleText.replace(/{\\.*?}/g, ''); // Remove tags
                        subtitleDisplay.style.bottom = '10px';
                        subtitleDisplay.style.top = 'auto';
                        subtitleDisplay.style.textAlign = 'right';
                    } else if (subtitleText.includes("{\\an4}")) {
                        subtitleText = subtitleText.replace(/{\\.*?}/g, ''); // Remove tags
                        subtitleDisplay.style.bottom = '50%';
                        subtitleDisplay.style.top = '50%';
                        subtitleDisplay.style.textAlign = 'left';
                    } else if (subtitleText.includes("{\\an5}")) {
                        subtitleText = subtitleText.replace(/{\\.*?}/g, ''); // Remove tags
                        subtitleDisplay.style.bottom = '50%';
                        subtitleDisplay.style.top = '50%';
                        subtitleDisplay.style.textAlign = 'center';
                    } else if (subtitleText.includes("{\\an6}")) {
                        subtitleText = subtitleText.replace(/{\\.*?}/g, ''); // Remove tags
                        subtitleDisplay.style.bottom = '50%';
                        subtitleDisplay.style.top = '50%';
                        subtitleDisplay.style.textAlign = 'right';
                    } else {
                        subtitleDisplay.style.bottom = '10px';
                        subtitleDisplay.style.textAlign = 'center';
                    }

                    // Highlight the current subtitle in the list
                    const subtitleItems = document.querySelectorAll('.subtitle-list-item');
                    subtitleItems.forEach(item => item.classList.remove('active'));
                    subtitleItems[index].classList.add('active');
                    subtitleItems[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });

            subtitleDisplay.innerHTML = subtitleText;
        });
    }


    function populateSubtitleList(subtitles) {
        subtitleList.innerHTML = ''; // Clear any existing subtitles
        subtitles.forEach((subtitle, index) => {
            const subtitleItem = document.createElement('div');
            subtitleItem.className = 'subtitle-list-item';
            subtitleItem.textContent = `${index + 1}: ${subtitle.edited ? subtitle.edited : subtitle.original}`;
            subtitleItem.setAttribute('data-index', index);
            subtitleItem.setAttribute('data-start-time', subtitle.start_time);
            subtitleItem.addEventListener('click', () => {
                const startTime = convertSRTtoSeconds(subtitle.start_time);
                videoPlayer.currentTime = startTime;
            });
            subtitleList.appendChild(subtitleItem);
            
        });
    }

    // Load and play the video selected by the user
    chooseFileButton.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'video/*';
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            const videoURL = URL.createObjectURL(file);
            videoPlayer.src = videoURL;
            videoPlayer.play();
        });
        fileInput.click();
    });

    // Volume control
    // volumeControl.addEventListener('input', (event) => {
    //     videoPlayer.volume = event.target.value;
    // });


    let rewindInterval, fastForwardInterval;

    // Rewind video by 10 seconds on click
    rewindButton.addEventListener('click', () => {
        videoPlayer.currentTime -= 10;
    });

    // Rewind video continuously when holding the button (mouse and touch)
    function startRewind() {
        rewindInterval = setInterval(() => {
            videoPlayer.currentTime -= 0.5; // Adjust the speed
        }, 100); // Interval in milliseconds
    }

    function stopRewind() {
        clearInterval(rewindInterval);
    }

    rewindButton.addEventListener('mousedown', startRewind);
    rewindButton.addEventListener('mouseup', stopRewind);
    rewindButton.addEventListener('mouseleave', stopRewind);
    rewindButton.addEventListener('touchstart', startRewind);
    rewindButton.addEventListener('touchend', stopRewind);

    // Fast forward video by 10 seconds on click
    fastForwardButton.addEventListener('click', () => {
        videoPlayer.currentTime += 10;
    });

    // Fast forward video continuously when holding the button (mouse and touch)
    function startFastForward() {
        fastForwardInterval = setInterval(() => {
            videoPlayer.currentTime += 0.5; // Adjust the speed
        }, 100); // Interval in milliseconds
    }

    function stopFastForward() {
        clearInterval(fastForwardInterval);
    }

    fastForwardButton.addEventListener('mousedown', startFastForward);
    fastForwardButton.addEventListener('mouseup', stopFastForward);
    fastForwardButton.addEventListener('mouseleave', stopFastForward);
    fastForwardButton.addEventListener('touchstart', startFastForward);
    fastForwardButton.addEventListener('touchend', stopFastForward);



    // Go to the previous subtitle
    previousSubtitleButton.addEventListener('click', () => {
        const currentTime = videoPlayer.currentTime;
        for (let i = subtitles.length - 1; i >= 0; i--) {
            const endTime = convertSRTtoSeconds(subtitles[i].end_time);
            const startTime = convertSRTtoSeconds(subtitles[i].start_time)
            if (endTime < currentTime) {
                videoPlayer.currentTime = startTime;
                break;
            }
        }
    });

    // Go to the next subtitle
    nextSubtitleButton.addEventListener('click', () => {
        const currentTime = videoPlayer.currentTime;
        for (let i = 0; i < subtitles.length; i++) {
            const startTime = convertSRTtoSeconds(subtitles[i].start_time);
            if (startTime > currentTime) {
                videoPlayer.currentTime = startTime;
                break;
            }
        }
    });


    // Sync subtitles button
    syncSubtitlesButton.addEventListener('click', async () => {
        subtitles = await fetchSubtitles(subtitleId);
        syncSubtitles(subtitles);
        populateSubtitleList(subtitles);
    });

    // Play/Pause button event
    playPauseButton.addEventListener('click', function () {
        togglePlayPause();
    });

    // Play/Pause function
    function togglePlayPause() {
        if (videoPlayer.paused) {
            videoPlayer.play();
            playPauseButton.innerHTML = '<i class="fa fa-pause"></i> Pause';
        } else {
            videoPlayer.pause();
            playPauseButton.innerHTML = '<i class="fa fa-play"></i> Play';
        }
    }

    // Copy Current Video Timing to Clipboard

    copyTimeButton.addEventListener('click', () => {
        const currentTime = videoPlayer.currentTime;
        const formattedTime = formatTimeForClipboard(currentTime);
        navigator.clipboard.writeText(formattedTime).then(() => {
            alert('Current time copied to clipboard: ' + formattedTime);
        }).catch(err => {
            console.error('Failed to copy time: ', err);
        });
    });

    function formatTimeForClipboard(time) {
        const date = new Date(null);
        date.setSeconds(time);
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const microSeconds = String(Math.floor((time % 1) * 1000)).padStart(3, '0');
        return `${hours}:${minutes}:${seconds},${microSeconds}`;
    }

    // Skip Video Timing to a Specific Subtitle Index

    skipToSubtitleButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`/last-index/${subtitleId}`);
            if (response.ok) {
                const subtitleData = await response.json();
                console.log("", subtitleData);
                const subtitleItem = document.querySelector(`.subtitle-list-item[data-index="${subtitleData - 1}"]`);
                console.log("", subtitleItem);
                if (subtitleItem) {
                    const startTime = subtitleItem.getAttribute('data-start-time');
                    const startTimeInSeconds = convertSRTtoSeconds(startTime);
                    videoPlayer.currentTime = startTimeInSeconds;
                }
            } else {
                alert('Failed to retrieve subtitle data.');
            }
        } catch (error) {
            console.error('Error fetching subtitle data:', error);
            alert('Error fetching subtitle data.');
        }
    });


    // Show popup for editing subtitles
    function showEditPopup(text, index) {
        if (videoPlayer.paused) { }
        else {
            videoPlayer.pause();
            playPauseButton.innerHTML = '<i class="fa fa-play"></i> Play';
        }
        editSubtitleText.value = text;
        editPopup.setAttribute('data-index', index); // Store the index in a data attribute
        editPopup.classList.remove('hidden');
    }

    // Hide popup for editing subtitles
    function hideEditPopup() {
        editPopup.classList.add('hidden');
        togglePlayPause();
    }

    // Handle close edit button
    closePopupButton.addEventListener('click', hideEditPopup);

    // Handle subtitle edit submission
    submitEditButton.addEventListener('click', async function () {
        const editedText = editSubtitleText.value;
        const index = editPopup.getAttribute('data-index'); // Retrieve the index from the data attribute
        const apiEndpoint = `/submit-edited`;
        const payload = {
            'text': editedText,
            'index': index,
            'subtitle_id': subtitleId
         };

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // alert('Subtitle edited successfully.');
                hideEditPopup();
                subtitles = await fetchSubtitles(subtitleId);
                syncSubtitles(subtitles);
                populateSubtitleList(subtitles);
            } else {
                alert('Failed to submit the edited subtitle.');
                hideEditPopup();
            }
        } catch (error) {
            console.error('Error submitting edited subtitle:', error);
            alert('Error submitting edited subtitle.');
            hideEditPopup();
        }
    });

    // Add event listeners for long touch or double click to edit subtitle in the subtitle list
    subtitleList.addEventListener('dblclick', function (event) {
        const subtitleItem = event.target.closest('.subtitle-list-item');
        if (subtitleItem) {
            const index = Array.from(subtitleList.children).indexOf(subtitleItem)+1;
            const currentText = subtitleItem.textContent.split(': ').slice(1).join(': '); // Extract text without index
            showEditPopup(currentText, index);
        }
    });

    let touchTimer;
    subtitleList.addEventListener('touchstart', function (event) {
        const subtitleItem = event.target.closest('.subtitle-list-item');
        if (subtitleItem) {
            touchTimer = setTimeout(function () {
                const index = Array.from(subtitleList.children).indexOf(subtitleItem)+1;
                const currentText = subtitleItem.textContent.split(': ').slice(1).join(': '); // Extract text without index
                showEditPopup(currentText, index);
            }, 800); // Adjust duration
        }
    });

    subtitleList.addEventListener('touchend', function () {
        clearTimeout(touchTimer);
    });


    // Fetch the subtitles and initialize the video player
    subtitles = await fetchSubtitles(subtitleId);
    if (subtitles.length > 0) {
        populateSubtitleList(subtitles);
        syncSubtitles(subtitles);
    }
})