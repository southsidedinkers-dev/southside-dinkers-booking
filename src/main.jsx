import React from "react";
import ReactDOM from "react-dom/client";
import BookingFlow from "./BookingFlow.jsx";
import AdminApp from "./AdminApp.jsx";

const isAdmin = window.location.pathname.startsWith("/admin");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdmin ? <AdminApp /> : <BookingFlow />}
  </React.StrictMode>
);
