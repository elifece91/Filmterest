# 🎬 Filmterest

**Filmterest** is a movie & TV-series discovery platform. Users can explore trending content, manage personal watchlists, rate & review what they've watched, follow friends, and build collaborative watchlists — all in real time.

Built with **vanilla JavaScript**, **Bootstrap 5**, the **TMDB API**, and **Firebase** (Auth + Cloud Firestore).

## ✨ Features

- 🔥 **Trending Content** — browse today's most popular movies *and* TV shows in a single mixed feed
- 🎛️ **Content-Type & Genre Filters** — filter by movies, TV shows, or documentaries, and by genre
- 🔎 **Smart Live Search** — search results always respect the active content-type filter
- 🎡 **Movie Wheel** — can't decide what to watch? Add up to 10 titles and spin the animated wheel
- 🔖 **Watchlist & Watched List** — one-click save, mark as watched, rate (⭐) and write short reviews
- 👥 **Community** — follow/unfollow users, view follower & following lists, browse public profiles
- 🤝 **Shared Lists** — create joint watchlists with a friend and check off what you watched together
- 📸 **Profile Customization** — upload a profile photo (auto-compressed to ~20 KB) or pick an avatar
- 🔐 **Email/Password Authentication** — powered by Firebase Auth
- 🛡️ **Firestore Security Rules** — user-based rules protect every account's data

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Structure | HTML5 |
| Styling | CSS3 (custom dark-neon theme) + Bootstrap 5 |
| Logic | Vanilla JavaScript (ES6+) |
| Backend | Firebase Authentication & Cloud Firestore |
| Data | [TMDB — The Movie Database API](https://www.themoviedb.org/documentation/api) |

## 🚀 Getting Started

The app is a **static site** — no build step required.

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/filmterest.git

# 2. Open index.html in your browser
#    (or use VS Code's "Live Server" extension for auto-reload)
```

> **Note:** To run it with your own data, create a free [Firebase](https://console.firebase.google.com) project and a [TMDB API key](https://www.themoviedb.org/settings/api), then plug your credentials into `app.js`.

## 📁 Project Structure

```
filmterest/
├── index.html   # Page structure: navbar, modals, movie grids (Bootstrap)
├── style.css    # Custom dark-purple neon theme
├── app.js       # All logic: TMDB requests, Firebase, UI rendering
├── README.md    # You are here! 🙂
└── LICENSE
```

## 📸 Screenshots

<!-- TODO: Add screenshots of your app here, e.g.:
![Home page](screenshots/home.png)
![Movie wheel](screenshots/wheel.png)
-->

## 📄 License

All rights reserved — see the [LICENSE](LICENSE) file. This project is published for portfolio & demonstration purposes.

---

⭐ If you like this project, feel free to star the repository!
