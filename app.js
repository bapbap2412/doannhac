// Danh sách bài hát (Dùng API iTunes để tự lấy audio & cover)
const defaultSongs = [
  { title: "Thằng Điên", artist: "JustaTee" },
  { title: "24H", artist: "LyLy" },
  { title: "Cô Đơn Không Muốn Về Nhà", artist: "Mr.A & Phạm Thùy Dung" },
  { title: "Mặt Trời Của Em", artist: "Phương Ly ft. JustaTee" },
  { title: "Anh Ơi Ở Lại", artist: "Chi Pu" },
  { title: "Có Em Chờ", artist: "Min" },
  { title: "Vì Yêu Cứ Đâm Đầu", artist: "Min ft. Đen & JustaTee" },
  { title: "Chưa Bao Giờ Mẹ Kể", artist: "Min ft. Erik" },
  { title: "Bước Qua Mùa Cô Đơn", artist: "Vũ." },
  { title: "Lạ Lùng", artist: "Vũ." },
  { title: "Một Ngày Mùa Thu", artist: "Vũ." },
  { title: "Đông Kiếm Em", artist: "Vũ." },
  { title: "Em Là", artist: "MONO" },
  { title: "Waiting For You", artist: "MONO" },
  { title: "Đi Tìm Tình Yêu", artist: "MONO" },
  { title: "Có Hẹn Với Thanh Xuân", artist: "MONSTAR" },
  { title: "Tình Yêu Chậm Trễ", artist: "MONSTAR" },
  { title: "Nếu Như Anh Thành Công", artist: "Châu Khải Phong" },
  { title: "Túy Âm", artist: "Xesi, Masew & Nhat Nguyen" },
  { title: "Khi Ta Có Nhau", artist: "Will" },
  { title: "Nơi Này Có Anh", artist: "Sơn Tùng M-TP" },
  { title: "Muộn Rồi Mà Sao Còn", artist: "Sơn Tùng M-TP" },
  { title: "Chúng Ta Của Hiện Tại", artist: "Sơn Tùng M-TP" },
  { title: "Có Chắc Yêu Là Đây", artist: "Sơn Tùng M-TP" },
  { title: "Cắt Đôi Nỗi Sầu", artist: "Tăng Duy Tân" },
  { title: "Bên Trên Tầng Lầu", artist: "Tăng Duy Tân" },
  { title: "Dạ Vũ", artist: "Tăng Duy Tân" },
  { title: "Tình Đầu Quá Chén", artist: "Quang Hùng MasterD" },
  { title: "Thủy Triều", artist: "Quang Hùng MasterD" },
  { title: "Dễ Đến Dễ Đi", artist: "Quang Hùng MasterD" },
  { title: "Hạ Còn Vương Nắng", artist: "DatKaa" },
  { title: "Có Không Giữ Mất Đừng Tìm", artist: "Trúc Nhân" },
  { title: "Từng Quen", artist: "Wren Evans" },
  { title: "Từng Quen", artist: "Wren Evans & itsnk" },
  { title: "Va Vào Giai Điệu Này", artist: "RPT MCK" },
  { title: "Chìm Sâu", artist: "RPT MCK ft. Trung Trần" },
  { title: "Anh Đã Ổn Hơn", artist: "RPT MCK" },
  { title: "Thích Em Hơi Nhiều", artist: "Wren Evans" },
  { title: "3107", artist: "W/n, Nâu & Duongg" },
  { title: "3107-3", artist: "W/n, Nâu & Duongg" }
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
const volumeSlider = document.getElementById("volume-slider");

// Mặc định âm lượng 80%
audio.volume = 0.8;

// Xử lý sự kiện kéo thanh âm lượng
if (volumeSlider) {
  volumeSlider.addEventListener("input", (e) => {
    const volumeValue = parseFloat(e.target.value);
    audio.volume = volumeValue;

    const volumeIcon = document.querySelector(".volume-icon");
    if (volumeIcon) {
      if (volumeValue === 0) volumeIcon.textContent = "🔇";
      else if (volumeValue < 0.5) volumeIcon.textContent = "🔉";
      else volumeIcon.textContent = "🔊";
    }
  });
}

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
  if (playedIndexes.length >= defaultSongs.length) {
    playedIndexes = [];
    console.log("🔄 Đã hoàn thành hết bài hát! Đang reset lại danh sách lượt chơi...");
  }

  const availableIndexes = defaultSongs
    .map((_, index) => index)
    .filter(index => !playedIndexes.includes(index));

  const randomIndex = Math.floor(Math.random() * availableIndexes.length);
  const selectedIndex = availableIndexes[randomIndex];

  playedIndexes.push(selectedIndex);

  return selectedIndex;
}

// 1. Khởi tạo Game
async function initGame() {
  currentStep = 0;
  songInput.value = "";
  if (suggestionsList) suggestionsList.innerHTML = "";
  resultModal.classList.add("hidden");

  clearTimeout(playTimeout);
  audio.pause();
  audio.currentTime = 0;
  isPlaying = false;

  playBtn.disabled = true;
  playBtn.style.opacity = "0.5";
  playBtn.style.cursor = "not-allowed";

  const selectedIndex = getNextUnplayedIndex();
  const selectedSong = defaultSongs[selectedIndex];

  const songData = await fetchSongDataFromAPI(selectedSong);

  if (songData && songData.audioUrl) {
    currentSong = songData;
    audio.src = currentSong.audioUrl;
    audio.load();

    playBtn.disabled = false;
    playBtn.style.opacity = "1";
    playBtn.style.cursor = "pointer";
  } else {
    initGame();
    return;
  }

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
