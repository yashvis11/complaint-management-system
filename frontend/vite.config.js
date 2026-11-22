import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",

  build: {
    rollupOptions: {
      input: {
        login: resolve(__dirname, "pages/login.html"),
        register: resolve(__dirname, "pages/register.html"),
        dashboard: resolve(__dirname, "pages/dashboard.html"),
        admin: resolve(__dirname, "pages/admin.html"),
        complaints: resolve(__dirname, "pages/complaints.html"),
        createComplaint: resolve(__dirname, "pages/create-complaint.html"),
        editComplaint: resolve(__dirname, "pages/edit-complaint.html"),
        complaintDetails: resolve(__dirname, "pages/complaint-details.html"),
        assigned: resolve(__dirname, "pages/assigned.html"),
        profile: resolve(__dirname, "pages/profile.html"),
      },
    },
  },
});
