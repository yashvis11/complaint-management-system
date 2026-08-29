CREATE DATABASE IF NOT EXISTS complaint_system;

USE complaint_system;

CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Complaint_Updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    updated_by INT NOT NULL,
    status ENUM('Pending', 'In Progress', 'Resolved', 'Rejected') NOT NULL,
    remarks TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (complaint_id) REFERENCES Complaints(id)
        ON DELETE CASCADE,

    FOREIGN KEY (updated_by) REFERENCES Users(id)
        ON DELETE CASCADE
);

-- Seed Sample Data for Testing & Demonstration
INSERT IGNORE INTO Users (id, name, email, password, role, created_at) VALUES
(1, 'Admin User', 'admin@example.com', '$2b$10$wO9Ww9iK6u7y1eJtL6n3Xe8O7K0mH1m4jYg1tJ1yH8h6U1a0Z8C.', 'admin', NOW() - INTERVAL 90 DAY),
(2, 'John Doe', 'john@example.com', '$2b$10$wO9Ww9iK6u7y1eJtL6n3Xe8O7K0mH1m4jYg1tJ1yH8h6U1a0Z8C.', 'user', NOW() - INTERVAL 60 DAY),
(3, 'Sarah Connor', 'sarah@example.com', '$2b$10$wO9Ww9iK6u7y1eJtL6n3Xe8O7K0mH1m4jYg1tJ1yH8h6U1a0Z8C.', 'user', NOW() - INTERVAL 45 DAY),
(4, 'Michael Scott', 'michael@example.com', '$2b$10$wO9Ww9iK6u7y1eJtL6n3Xe8O7K0mH1m4jYg1tJ1yH8h6U1a0Z8C.', 'user', NOW() - INTERVAL 30 DAY);

INSERT IGNORE INTO Complaints (id, user_id, title, description, category, priority, status, created_at, updated_at) VALUES
(1, 2, 'Wi-Fi connection drops frequently in Room 302', 'The 5GHz network disconnects every 10 minutes.', 'Network', 'High', 'Resolved', NOW() - INTERVAL 50 DAY, NOW() - INTERVAL 45 DAY),
(2, 2, 'Broken projector in Lab 4', 'Projector HDMI port is loose and display flickers constantly.', 'Hardware', 'Medium', 'In Progress', NOW() - INTERVAL 40 DAY, NOW() - INTERVAL 20 DAY),
(3, 3, 'Unable to access student portal grade section', 'Getting 500 error when clicking on Semester 4 results tab.', 'Software', 'High', 'Pending', NOW() - INTERVAL 25 DAY, NOW() - INTERVAL 25 DAY),
(4, 3, 'Air conditioning leaking water in Library 2nd floor', 'Water dripping near study desks.', 'Facilities', 'High', 'Resolved', NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 15 DAY),
(5, 4, 'Printer out of toner in Staff Room', 'Need black toner cartridge replacement urgently.', 'Hardware', 'Low', 'Resolved', NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 12 DAY),
(6, 4, 'Request for LMS course enrollment update', 'Enrollment key for Data Structures not working for 5 students.', 'Software', 'Medium', 'In Progress', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 5 DAY),
(7, 2, 'Broken desk chair in Study Hall B', 'Chair wheel is broken and unstable.', 'Facilities', 'Low', 'Rejected', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 4 DAY),
(8, 3, 'VPN authentication fails for remote lab access', 'Radius server timeout during off-campus login.', 'Network', 'High', 'Pending', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
(9, 4, 'Delay in ID card issuance approval', 'Submitted renewal form two weeks ago but status is still unverified.', 'Administration', 'Medium', 'Pending', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY);

INSERT IGNORE INTO Complaint_Updates (id, complaint_id, updated_by, status, remarks, updated_at) VALUES
(1, 1, 1, 'In Progress', 'Network engineer assigned to check access point in Room 302.', NOW() - INTERVAL 48 DAY),
(2, 1, 1, 'Resolved', 'Replaced faulty access point firmware and tested signal strength.', NOW() - INTERVAL 45 DAY),
(3, 2, 1, 'In Progress', 'Ordered replacement HDMI cable assembly.', NOW() - INTERVAL 20 DAY),
(4, 4, 1, 'Resolved', 'Drainage pipe cleared and maintenance completed.', NOW() - INTERVAL 15 DAY),
(5, 7, 1, 'Rejected', 'Item marked for scheduled annual furniture disposal.', NOW() - INTERVAL 4 DAY);