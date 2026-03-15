import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    // Not logged in
    return <Navigate to="/signin" />;
  }

  // Logged in
  return children;
}

export default ProtectedRoute;