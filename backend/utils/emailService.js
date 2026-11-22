const nodemailer = require("nodemailer");

// Create email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Common function to send emails
const sendEmail = async (to, subject, html) => {
  return await transporter.sendMail({
    from: `"ComplaintMS" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

// 1. Email when a complaint is registered
const sendComplaintAcknowledgement = async (complaint, user) => {
  const subject = `Complaint Registered - CMP${complaint.id}`;

  const html = `
        <h2>Complaint Successfully Registered</h2>

        <p>Dear ${user.name},</p>

        <p>Your complaint has been successfully recorded
        in our Complaint Management System.</p>

        <h3>Complaint Details</h3>

        <p><strong>Complaint ID:</strong> CMP${complaint.id}</p>
        <p><strong>Title:</strong> ${complaint.title}</p>
        <p><strong>Category:</strong> ${complaint.category}</p>
        <p><strong>Priority:</strong> ${complaint.priority}</p>
        <p><strong>Status:</strong> Pending</p>

        <p>You can log in to ComplaintMS to track your complaint.</p>

        <p>Regards,<br>Complaint Management Team</p>
    `;

  return sendEmail(user.email, subject, html);
};

// 2. Email when a complaint is assigned to staff
const sendAssignmentNotification = async (complaint, user, staff) => {
  const subject = `Complaint Assigned - CMP${complaint.id}`;

  const html = `
        <h2>Your Complaint Has Been Assigned</h2>

        <p>Dear ${user.name},</p>

        <p>Your complaint has been assigned to a staff member
        for further handling.</p>

        <h3>Complaint Details</h3>

        <p><strong>Complaint ID:</strong> CMP${complaint.id}</p>
        <p><strong>Title:</strong> ${complaint.title}</p>
        <p><strong>Category:</strong> ${complaint.category}</p>
        <p><strong>Priority:</strong> ${complaint.priority}</p>

        <h3>Assigned Staff Details</h3>

        <p><strong>Name:</strong> ${staff.name}</p>
        <p><strong>Department:</strong> ${staff.department || "Not specified"}</p>

        <p>You can log in to ComplaintMS to track your complaint.</p>

        <p>Regards,<br>Complaint Management Team</p>
    `;

  return sendEmail(user.email, subject, html);
};

// 3. Email when a staff account is approved or rejected
const sendStaffVerificationEmail = async (user, status) => {
  const approved = status === "Approved";

  const subject = approved
    ? "Staff Account Approved - ComplaintMS"
    : "Staff Registration Rejected - ComplaintMS";

  const html = `
        <h2>${approved ? "Account Approved" : "Registration Rejected"}</h2>

        <p>Dear ${user.name},</p>

        ${
          approved
            ? `
                    <p>Your staff registration has been approved.</p>
                    <p>You can now log in to ComplaintMS and access
                    your staff dashboard.</p>
                `
            : `
                    <p>Unfortunately, your staff registration has been rejected.</p>
                    <p>Please contact the administrator for further information.</p>
                `
        }

        <p>Regards,<br>Complaint Management Team</p>
    `;

  return sendEmail(user.email, subject, html);
};

module.exports = {
  sendComplaintAcknowledgement,
  sendAssignmentNotification,
  sendStaffVerificationEmail,
};
