'use client';

import toast from "react-hot-toast";

export default function LogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem("username");

    window.dispatchEvent(new Event("storage"));

    toast.success("Logged out successfully!");
  };

  return (
    <button onClick={handleLogout} className="btn-danger">
      Logout
    </button>
  );
}
