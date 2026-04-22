import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ExamRoom from "./pages/ExamRoom";
import CreateExam from "./pages/CreateExam";
import ManageExam from "./pages/ManageExam";
import QuestionBank from "./pages/QuestionBank";
import Profile from "./pages/Profile";
import ResultPage from "./pages/ResultPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin/create-exam" element={<CreateExam />} />
      <Route path="/admin/exam/:examId" element={<ManageExam />} />
      <Route path="/admin/question-bank" element={<QuestionBank />} />
      <Route path="/exam/:examId" element={<ExamRoom />} />
      <Route path="/exam/:examId/result" element={<ResultPage />} />
    </Routes>
  );
}

export default App;
