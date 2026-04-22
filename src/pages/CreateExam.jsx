import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn, UserButton } from "@clerk/clerk-react";

export default function CreateExam() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    duration_minutes: 60,
    total_marks: 100,
    marks_per_question: 2,
    negative_marks: 0.5,
    valid_from: "",
    valid_until: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = { ...formData };
      if (payload.valid_from) payload.valid_from = new Date(payload.valid_from).toISOString();
      if (payload.valid_until) payload.valid_until = new Date(payload.valid_until).toISOString();

      const response = await fetch("https://prepexam-backend.onrender.com/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("✅ Exam Created Successfully! You can now add questions to it.");
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setMessage("🔴 Error: " + (data.error || "Unknown Error"));
      }
    } catch (err) {
      console.error(err);
      setMessage("🔴 Server Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] p-6 font-sans flex flex-col items-center">
      
      {/* NAVBAR */}
      <nav className="w-full max-w-4xl h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center px-6 mb-8">
        <h1 className="text-xl font-bold text-indigo-700">Admin Portal - Create Exam</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-sm font-semibold text-gray-500 hover:text-gray-800">Back to Dashboard</button>
          <SignedIn><UserButton /></SignedIn>
        </div>
      </nav>

      {/* FORM CONTAINER */}
      <div className="w-full max-w-4xl bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Configure New Examination</h2>
          <p className="text-gray-500 mt-2">Define the rules, timing, and marking scheme for your new test.</p>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-xl font-bold ${message.startsWith('✅') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">Exam Title</label>
            <input required name="title" value={formData.title} onChange={handleChange} type="text" placeholder="e.g., Physics Final Semester 6" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Duration (Minutes)</label>
              <input required name="duration_minutes" value={formData.duration_minutes} onChange={handleChange} type="number" min="1" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Total Marks</label>
              <input required name="total_marks" value={formData.total_marks} onChange={handleChange} type="number" min="1" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Marks for Correct Answer</label>
              <input required name="marks_per_question" value={formData.marks_per_question} onChange={handleChange} type="number" min="1" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Negative Marks (Per Wrong Answer)</label>
              <input required name="negative_marks" value={formData.negative_marks} onChange={handleChange} type="number" step="0.1" min="0" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Exam Valid From (Open Time)</label>
              <input required name="valid_from" value={formData.valid_from} onChange={handleChange} type="datetime-local" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Exam Expires At (Close Time)</label>
              <input required name="valid_until" value={formData.valid_until} onChange={handleChange} type="datetime-local" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition" />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button disabled={loading} type="submit" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 flex items-center gap-2">
               {loading ? 'Creating...' : '💾 Save & Create Exam'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
