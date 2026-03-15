import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Main from "./pages/Main";
import ProtectedRoute from "./routes/ProtectedRoutes.jsx";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/main" element={<ProtectedRoute><main></main></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
