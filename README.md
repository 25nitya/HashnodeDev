
# HashnodeDev 🚀

A modern full-stack developer publishing and blogging platform inspired by Hashnode. Built with FastAPI, MongoDB Motor (async), React, and Tailwind CSS.

---

 📌 Features

- **User Authentication:** Secure JWT-based registration, login, profile management, and password reset flows.
- **Article Publishing:** Markdown-supported rich blogging editor with support for draft and published workflows.
- **Tagging & Filtering:** Categorize articles with dynamic topic tags and slug-based routing.
- **Responsive UI:** Clean interface with dark/light visual clarity and responsive navigation.
- **Async Database Architecture:** High-throughput non-blocking queries powered by Motor and MongoDB Atlas with automated indexing.

---

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI, Motor (Async MongoDB), Pydantic, Uvicorn
- **Frontend:** React, React Router, Tailwind CSS, Lucide Icons, Axios
- **Database:** MongoDB Atlas
- **Authentication & Security:** JWT (JSON Web Tokens), Passlib (bcrypt), CORS middleware

---

## 📂 Project Structure

```text
HashnodeDev/
├── client/              # React frontend (Vite / CRA)
│   ├── src/
│   │   ├── api/        # Axios configurations
│   │   ├── pages/      # Route pages (Home, Editor, ResetPassword, Profile)
│   │   └── ...
│   └── package.json
├── server/              # FastAPI Python backend
│   ├── app/
│   │   ├── routes/     # Auth, posts, and tags route handlers
│   │   ├── database.py # Motor client & collection setup
│   │   └── main.py     # FastAPI entry point
│   └── requirements.txt
├── .gitignore
└── README.md
