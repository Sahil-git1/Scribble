# 🖌️ Scribble Showdown 🎮  
### A Real-Time Multiplayer Drawing & Guessing Game Powered by Hand Gestures & AI 🎯

Welcome to **Scribble Showdown** – the ultimate Pictionary-style game where you *draw* without a mouse and *guess* against your friends in real-time!  
All you need is your webcam and your imagination. No controllers, no buttons – just ✋ and 🧠.

---

## 🚀 Features

- 🎨 **Draw with your hands** using Google MediaPipe’s real-time hand tracking
- 🕹️ **Multiplayer madness** with Socket.IO – join rooms and compete with friends
- ⏱️ **Timed rounds**, hidden word prompts, score tracking, and leaderboards
- 💬 **Live chat** with everyone in your game room
- 🧠 **Guess the drawing** to earn points and climb the scoreboard
- 🔒 **Private game rooms** with unique Room IDs
- 📷 **No mouse needed** – draw using pinch gestures (thumb + index finger)


---

## 🎥 How It Works

Using Google’s official [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html), the app captures your hand landmarks and detects gestures in real-time.

- ✍️ **Pinch to Draw** (Touch your index finger and thumb)
- ✋ **Hand** to erase the drawing

This creates a fun and intuitive experience where your hand becomes your paintbrush!

---

## 🧑‍💻 Tech Stack

### Frontend
- React.js 
- MediaPipe Hands (via TensorFlow.js or CDN)
- Socket.IO client

### Backend
- Node.js + Express
- Socket.IO server
- MongoDB for player profiles, scores, and history

---


