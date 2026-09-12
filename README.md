
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

## ⚙️ Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- MongoDB Atlas cluster URI

---

### 1. Clone the Repository
```bash
git clone [https://github.com/25nitya/HashnodeDev.git](https://github.com/25nitya/HashnodeDev.git)
cd HashnodeDev

#Backend Setup
cd server
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create a .env file inside server/ with:
# MONGO_URI=your_mongodb_atlas_uri
# JWT_SECRET=your_jwt_secret_key
# FRONTEND_URL=http://localhost:5173

uvicorn app.main:app --reload --port 8000

#Frontend Setup
cd ../client
npm install
npm run dev

The app will be running at http://localhost:5173, and the API docs will be available at http://localhost:8000/docs