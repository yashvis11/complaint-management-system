# Complaint Management System

A web-based Complaint Management System developed with **HTML5, CSS3, Bootstrap 5, JavaScript**, powered by a **Node.js (Express.js)** REST API, backed by **MySQL 8.0**, and containerized using **Docker & Docker Compose**.

---

## 👥 Team Roles & Responsibilities

| Role | Member Responsibilities | Key Features / Artifacts |
| :--- | :--- | :--- |
| **Member 1** | **Authentication & User Management** | User registration, login/logout, role-based access (User/Admin), password hashing (bcrypt), profile page. |
| **Member 2** | **Complaint Management** | Create complaint, edit (before review), delete, complaint history, category & priority assignment. |
| **Member 3** | **Admin Panel & Status Tracking** | View all complaints, assign complaints, status updates (Pending, In Progress, Resolved, Rejected), admin remarks, search & filter. |
| **Member 4** | **Dashboard, Reports & Docker** *(This Module)* | KPI statistics, Chart.js visualizations, CSV/PDF reports export, Docker containerization, `docker-compose.yml`, MySQL container setup, repository & documentation. |

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Bootstrap 5, FontAwesome 6, Chart.js (v4)
- **Backend**: Node.js, Express.js (`express`, `cors`, `dotenv`, `express-session`, `bcrypt`, `mysql2`)
- **Database**: MySQL 8.0
- **Containerization**: Docker, Docker Compose

---

## 📂 Project Structure

```
complaint-management-system/
├── Dockerfile                  # Root Dockerfile for backend container
├── docker-compose.yml          # Docker Compose (Node.js Backend + MySQL 8.0)
├── .dockerignore               # Files ignored during Docker build
├── README.md                   # Complete documentation and setup guide
│
├── backend/
│   ├── Dockerfile              # Backend-specific Dockerfile
│   ├── .dockerignore
│   ├── .env.example            # Sample environment variables
│   ├── package.json            # Node.js dependencies and scripts
│   ├── server.js               # Express application entry point
│   ├── config/
│   │   └── db.js               # MySQL connection pool configuration
│   ├── controllers/
│   │   ├── authController.js        # Member 1
│   │   ├── complaintController.js   # Member 2
│   │   ├── adminController.js       # Member 3
│   │   └── dashboardController.js   # Member 4 (Stats, Charts, CSV/PDF Export)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── adminRoutes.js
│   │   └── dashboardRoutes.js       # Member 4 API Routes
│   └── middleware/
│
├── database/
│   └── schema.sql              # Database schema and seed data
│
└── frontend/
    ├── css/
    │   └── style.css           # Custom styles, card designs, print CSS
    ├── js/
    │   ├── auth.js
    │   ├── complaints.js
    │   ├── admin.js
    │   └── dashboard.js        # Member 4 Chart.js & export logic
    └── pages/
        ├── dashboard.html      # Member 4 Analytics & Reports Dashboard
        ├── login.html
        ├── register.html
        ├── profile.html
        ├── complaints.html
        ├── create-complaint.html
        ├── edit-complaint.html
        ├── complaint-details.html
        └── admin.html
```

---

## 🚀 Quick Start with Docker (Recommended)

Run the entire application (Node.js backend + MySQL database + auto-seeded tables) with a single command.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Clone the repository
```bash
git clone https://github.com/yashvis11/complaint-management-system.git
cd complaint-management-system
```

### 2. Start containers with Docker Compose
```bash
docker compose up --build
```

### 3. Access the Application
- **Dashboard & Frontend UI**: [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/pages/dashboard.html](http://localhost:3000/pages/dashboard.html)
- **Backend API Health**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **MySQL Database**: `localhost:3306` (`user: root`, `password: rootpassword`, `database: complaint_system`)

To stop the containers:
```bash
docker compose down
```

---

## 💻 Manual / Local Development Setup (Without Docker)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) running locally.

### 1. Database Setup
1. Log into your local MySQL server:
   ```bash
   mysql -u root -p
   ```
2. Execute the schema file to initialize the database and tables:
   ```sql
   source ./database/schema.sql;
   ```

### 2. Backend Setup
1. Navigate into the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=complaint_system
   SESSION_SECRET=your_secret_key_here
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000/pages/dashboard.html`.

---

## 📊 Member 4 API Reference (Dashboard & Reports)

| Method | Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | KPI summary statistics (Total, Pending, In Progress, Resolved, Rejected, High Priority counts) and recent complaints list. | `status`, `category`, `priority`, `startDate`, `endDate` |
| `GET` | `/api/dashboard/charts` | Chart-specific datasets for Status doughnut, Category bar chart, Monthly trend line chart, and Priority pie chart. | `status`, `category`, `priority` |
| `GET` | `/api/dashboard/export/csv` | Streams downloadable CSV report file with all filtered complaints and user details. | `status`, `category`, `priority`, `startDate`, `endDate` |
| `GET` | `/api/dashboard/report-summary` | Aggregated report summary payload for reporting and printable views. | `status`, `category`, `priority`, `startDate`, `endDate` |
| `GET` | `/api/health` | Checks Node.js server health and MySQL database connectivity. | None |

---

## 🧪 Testing

1. **Health Check**: Run `curl http://localhost:3000/api/health` or visit in browser to verify that the server connects to MySQL.
2. **Dashboard Statistics**: Test `GET http://localhost:3000/api/dashboard/stats` to ensure aggregate queries return correct counts.
3. **CSV Export**: Click the **"Export CSV Report"** button on the dashboard or visit `GET http://localhost:3000/api/dashboard/export/csv` to verify CSV download.
4. **PDF / Print Report**: Click **"Print / Export PDF"** on the dashboard to generate printable reports.
