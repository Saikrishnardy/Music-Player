console.log('Lets write JavaScript');

let currentSong = new Audio();
let songs = [];
let currFolder = "";

// Converts seconds into MM:SS format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Load songs from folder
async function getSongs(folder) {
    try {
        currFolder = folder;
        let res = await fetch(`/${folder}/`);
        let html = await res.text();
        let div = document.createElement("div");
        div.innerHTML = html;
        let links = div.getElementsByTagName("a");
        songs = [];

        for (let link of links) {
            if (link.href.endsWith(".mp3")) {
                songs.push(link.href.split(`/${folder}/`)[1]);
            }
        }

        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";
        songs.forEach(song => {
            songUL.innerHTML += `
                <li>
                    <img class="invert" width="34" src="img/music.svg" alt="">
                    <div class="info">
                        <div>${song.replaceAll("%20", " ")}</div>
                        <div>Artist</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="img/play.svg" alt="">
                    </div>
                </li>`;
        });

        document.querySelectorAll(".songList li").forEach(li => {
            li.addEventListener("click", () => {
                const track = li.querySelector(".info div").innerText.trim();
                playMusic(track);
            });
        });

    } catch (err) {
        console.error("Error loading songs:", err);
    }
}

// Play or pause music
function playMusic(track, pause = false) {
    currentSong.src = `/${currFolder}/${track}`;
    document.querySelector(".songinfo").innerText = decodeURI(track);
    document.querySelector(".songtime").innerText = "00:00 / 00:00";

    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
}

// Load album cards from albums.json
async function displayAlbums() {
    try {
        let res = await fetch("/songs/albums.json");
        let albums = await res.json();

        let container = document.querySelector(".cardContainer");
        container.innerHTML = "";

        albums.forEach(album => {
            container.innerHTML += `
                <div data-folder="${album.folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <img src="${album.cover}" alt="">
                    <h2>${album.title}</h2>
                    <p>${album.description}</p>
                </div>`;
        });

        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", async () => {
                songs = await getSongs(`songs/${card.dataset.folder}`);
                playMusic(songs[0]);
            });
        });
    } catch (err) {
        console.error("Could not load albums.json:", err);
        document.querySelector(".cardContainer").innerHTML = `<p style="color: white;">Unable to load albums. Please check if albums.json is available.</p>`;
    }
}

// Main app logic
async function main() {
    await getSongs("songs/ncs");
    playMusic(songs[0], true);
    await displayAlbums();

    // Play/pause button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Update time and progress
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerText = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar interaction
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width);
        document.querySelector(".circle").style.left = percent * 100 + "%";
        currentSong.currentTime = percent * currentSong.duration;
    });

    // Hamburger menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous/Next controls
    previous.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) playMusic(songs[index - 1]);
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index + 1 < songs.length) playMusic(songs[index + 1]);
    });

    // Volume control
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = e.target.value / 100;
        document.querySelector(".volume>img").src = currentSong.volume > 0 ? "img/volume.svg" : "img/mute.svg";
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = "img/mute.svg";
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "img/volume.svg";
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
