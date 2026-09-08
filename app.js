// Danh sách bài hát (Dùng API iTunes để tự lấy audio & cover)
const defaultSongs = [
  { title: "The One That Got Away", artist: "Katy Perry" },
  { title: "Someone Like You", artist: "Adele" },
  { title: "Let Her Go", artist: "Passenger" },
  { title: "When I Was Your Man", artist: "Bruno Mars" },
  { title: "Happier", artist: "Ed Sheeran" },
  { title: "Perfect", artist: "Ed Sheeran" },
  { title: "Photograph", artist: "Ed Sheeran" },
  { title: "Thinking Out Loud", artist: "Ed Sheeran" },
  { title: "Talking to the Moon", artist: "Bruno Mars" },
  { title: "Just The Way You Are", artist: "Bruno Mars" },
  { title: "Grenade", artist: "Bruno Mars" },
  { title: "It Will Rain", artist: "Bruno Mars" },
  { title: "Love Yourself", artist: "Justin Bieber" },
  { title: "Sorry", artist: "Justin Bieber" },
  { title: "Let Me Love You", artist: "DJ Snake ft. Justin Bieber" },
  { title: "Stay", artist: "The Kid LAROI & Justin Bieber" },
  { title: "Dusk Till Dawn", artist: "ZAYN ft. Sia" },
  { title: "PILLOWTALK", artist: "ZAYN" },
  { title: "Until I Found You", artist: "Stephen Sanchez" },
  { title: "Heather", artist: "Conan Gray" },
  { title: "Arcade", artist: "Duncan Laurence" },
  { title: "Lovely", artist: "Billie Eilish & Khalid" },
  { title: "when the party's over", artist: "Billie Eilish" },
  { title: "Happier Than Ever", artist: "Billie Eilish" },
  { title: "idontwannabeyouanymore", artist: "Billie Eilish" },
  { title: "traitor", artist: "Olivia Rodrigo" },
  { title: "drivers license", artist: "Olivia Rodrigo" },
  { title: "deja vu", artist: "Olivia Rodrigo" },
  { title: "vampire", artist: "Olivia Rodrigo" },
  { title: "All Too Well", artist: "Taylor Swift" },
  { title: "Back To December", artist: "Taylor Swift" },
  { title: "cardigan", artist: "Taylor Swift" },
  { title: "exile", artist: "Taylor Swift ft. Bon Iver" },
  { title: "Another Love", artist: "Tom Odell" },
  { title: "Before You Go", artist: "Lewis Capaldi" },
  { title: "Someone You Loved", artist: "Lewis Capaldi" },
  { title: "Wish You Were Here", artist: "Pink Floyd" },
  { title: "The Night We Met", artist: "Lord Huron" },
  { title: "A Thousand Years", artist: "Christina Perri" },
  { title: "Say You Won't Let Go", artist: "James Arthur" }
];

// Các mốc thời gian (giây)
const timeSteps = [0.5, 1, 2, 4, 8, 15];
const TOTAL_DURATION = 15;

let currentSong = null;
let currentStep = 0;
let isPlaying = false;
let playTimeout = null;

// Mảng lưu danh sách các chỉ số (index) bài hát ĐÃ CHƠI
let playedIndexes = [];

const audio = new Audio();

// Lấy các phần tử DOM
const playBtn = document.getElementById("play-btn");
const songInput = document.getElementById("song-input");
const suggestionsList = document.getElementById("suggestions");
const skipBtn = document.getElementById("skip-btn");
const attemptsBoxes = document.querySelectorAll(".attempt-box");
const resultModal = document.getElementById("result-modal");
const resultTitle = document.getElementById("result-title");
const resultCover = document.getElementById("result-cover");
const resultSongInfo = document.getElementById("result-song-info");
const restartBtn = document.getElementById("restart-btn");
const timeText = document.getElementById("time-text");
const timeIndicator = document.getElementById("time-indicator");
const progressFill = document.getElementById("progress-fill");

// 🌐 HÀM GỌI API ITUNES
async function fetchSongDataFromAPI(songObj) {
  const query = encodeURIComponent(`${songObj.title} ${songObj.artist}`);
  const apiUrl = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const track = data.results[0];
      return {
        title: songObj.title,
        artist: songObj.artist,
        audioUrl: track.previewUrl,
        coverUrl: track.artworkUrl100.replace("100x100bb", "400x400bb")
      };
    } else {
      console.warn(`Không tìm thấy nhạc trên API cho: ${songObj.title}`);
      return null;
    }
  } catch (error) {
    console.error("Lỗi khi kết nối API:", error);
    return null;
  }
}

// Cập nhật vị trí con trỏ thời gian & reset thanh tiến trình về 0s
function updateTimeIndicator() {
  const currentTime = timeSteps[currentStep];
  if (timeText) timeText.textContent = `${currentTime} ${currentTime === 1 ? 'second' : 'seconds'}`;

  const positions = ["3.33%", "6.67%", "13.33%", "26.67%", "53.33%", "100%"];
  if (timeIndicator) timeIndicator.style.left = positions[currentStep] || "100%";

  if (progressFill) {
    progressFill.style.transition = "none";
    progressFill.style.width = "0%";
  }
}

// 🎯 HÀM LẤY BÀI HÁT KHÔNG BỊ LẶP
function getNextUnplayedIndex() {
  // Nếu đã chơi hết tất cả các bài hát trong danh sách -> Reset lại mảng
  if (playedIndexes.length >= defaultSongs.length) {
    playedIndexes = [];
    console.log("🔄 Đã hoàn thành hết bài hát! Đang reset lại danh sách lượt chơi...");
  }

  // Lọc ra danh sách các vị trí index CHƯA CHƠI
  const availableIndexes = defaultSongs
    .map((_, index) => index)
    .filter(index => !playedIndexes.includes(index));

  // Chọn ngẫu nhiên 1 index trong danh sách bài chưa chơi
  const randomIndex = Math.floor(Math.random() * availableIndexes.length);
  const selectedIndex = availableIndexes[randomIndex];

  // Lưu index này vào danh sách đã chơi
  playedIndexes.push(selectedIndex);

  return selectedIndex;
}

// 1. Khởi tạo Game
async function initGame() {
  currentStep = 0;
  songInput.value = "";
  if (suggestionsList) suggestionsList.innerHTML = "";
  resultModal.classList.add("hidden");

  // Dừng nhạc cũ
  clearTimeout(playTimeout);
  audio.pause();
  audio.currentTime = 0;
  isPlaying = false;

  // Khóa nút Play tạm thời trong lúc tải nhạc từ API
  playBtn.disabled = true;
  playBtn.style.opacity = "0.5";
  playBtn.style.cursor = "not-allowed";

  // Lấy bài hát không bị lặp
  const selectedIndex = getNextUnplayedIndex();
  const selectedSong = defaultSongs[selectedIndex];

  // Call API để lấy audioUrl và coverUrl
  const songData = await fetchSongDataFromAPI(selectedSong);

  if (songData && songData.audioUrl) {
    currentSong = songData;
    audio.src = currentSong.audioUrl;
    audio.load();

    playBtn.disabled = false;
    playBtn.style.opacity = "1";
    playBtn.style.cursor = "pointer";
  } else {
    // Nếu lỗi kết nối bài này, tự chọn lại bài chưa chơi khác
    initGame();
    return;
  }

  // Reset các ô đoán
  attemptsBoxes.forEach((box) => {
    box.className = "attempt-box";
    box.textContent = "";
  });

  updateTimeIndicator();
}

// 2. Phát nhạc ở các lượt đoán
playBtn.addEventListener("click", () => {
  if (isPlaying || !currentSong) return;

  const maxTime = timeSteps[currentStep];

  clearTimeout(playTimeout);
  audio.currentTime = 0;

  if (progressFill) {
    progressFill.style.transition = "none";
    progressFill.style.width = "0%";
  }

  const playPromise = audio.play();

  if (playPromise !== undefined) {
    playPromise.then(() => {
      isPlaying = true;
      playBtn.style.transform = "scale(0.9)";

      const targetPercent = (maxTime / TOTAL_DURATION) * 100;

      requestAnimationFrame(() => {
        if (progressFill) {
          progressFill.style.transition = `width ${maxTime}s linear`;
          progressFill.style.width = `${targetPercent}%`;
        }
      });

      playTimeout = setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        isPlaying = false;
        playBtn.style.transform = "scale(1)";

        if (progressFill) {
          progressFill.style.transition = "none";
          progressFill.style.width = "0%";
        }
      }, maxTime * 1000);

    }).catch(error => {
      console.error("Lỗi phát nhạc:", error);
      isPlaying = false;
      playBtn.style.transform = "scale(1)";
    });
  }
});

// 3. Gợi ý bài hát khi gõ
songInput.addEventListener("input", () => {
  const query = songInput.value.trim().toLowerCase();
  suggestionsList.innerHTML = "";
  if (!query) return;

  const matches = defaultSongs.filter(s => 
    s.title.toLowerCase().includes(query) || s.artist.toLowerCase().includes(query)
  );

  matches.forEach(song => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.textContent = `${song.title} - ${song.artist}`;
    div.onclick = () => {
      songInput.value = `${song.title} - ${song.artist}`;
      suggestionsList.innerHTML = "";
      submitGuess();
    };
    suggestionsList.appendChild(div);
  });
});

// 4. Nút Skip & Submit
skipBtn.addEventListener("click", () => {
  if (!currentSong) return;
  handleAttempt(false, "Skipped");
});

function submitGuess() {
  if (!currentSong) return;
  const userGuess = songInput.value.trim().toLowerCase();
  if (!userGuess) return;

  const isCorrect = userGuess.includes(currentSong.title.toLowerCase());
  handleAttempt(isCorrect, songInput.value);
}

// 5. Cập nhật lượt chơi
function handleAttempt(isCorrect, textDisplay) {
  clearTimeout(playTimeout);
  audio.pause();
  audio.currentTime = 0;
  isPlaying = false;
  playBtn.style.transform = "scale(1)";

  const currentBox = attemptsBoxes[currentStep];

  if (isCorrect) {
    currentBox.classList.add("correct");
    currentBox.textContent = `${currentSong.title} - ${currentSong.artist}`;
    endGame(true);
  } else {
    if (textDisplay === "Skipped") {
      currentBox.classList.add("skipped");
      currentBox.textContent = "Skipped";
    } else {
      currentBox.classList.add("wrong");
      currentBox.textContent = textDisplay;
    }

    currentStep++;
    songInput.value = "";
    suggestionsList.innerHTML = "";

    if (currentStep >= timeSteps.length) {
      endGame(false);
    } else {
      updateTimeIndicator();
    }
  }
}

// 6. Kết thúc game
function endGame(isWin) {
  clearTimeout(playTimeout);

  resultTitle.textContent = isWin ? "🎉 BẠN ĐÃ ĐOÁN ĐÚNG!" : "❌ RẤT TIẾC, HẾT LƯỢT!";
  resultCover.src = currentSong.coverUrl;
  resultSongInfo.textContent = `${currentSong.title} - ${currentSong.artist}`;

  resultModal.classList.remove("hidden");

  if (progressFill) {
    progressFill.style.transition = "none";
    progressFill.style.width = "100%";
  }

  audio.currentTime = 0;
  audio.play().then(() => {
    isPlaying = true;
  }).catch(error => {
    console.error("Lỗi phát full bài:", error);
  });
}

restartBtn.addEventListener("click", initGame);

// Chạy game
initGame();