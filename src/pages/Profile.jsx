import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({ name: "", roll_number: "" });

  useEffect(() => {
    if (!user) return;
    fetch(`https://prepexam-backend.onrender.com/api/users/me?clerk_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setDbUser(data.user);
          setFormData({ name: data.user.name || "", roll_number: data.user.roll_number || "" });
        }
      })
      .catch(err => console.error("Profile Fetch Error:", err))
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const getSem = (roll) => {
    const r = (roll || '').toUpperCase();
    if (r.startsWith('CS-6')) return '6th Semester';
    if (r.startsWith('CS-5')) return '5th Semester';
    if (r.startsWith('CS-4')) return '4th Semester';
    if (r.startsWith('CS-3')) return '3rd Semester';
    if (r.startsWith('CS-2')) return '2nd Semester';
    if (r.startsWith('CS-1')) return '1st Semester';
    return 'Not Assigned';
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("https://prepexam-backend.onrender.com/api/users/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_id: user.id, name: formData.name, roll_number: formData.roll_number })
      });
      if (res.ok) alert("✅ Profile Information Updated Successfully!");
      else alert("Failed to save profile on server.");
    } catch (err) {
      alert("Network error.");
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-[#f4f6fa] flex items-center justify-center font-bold text-gray-500">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-[#f4f6fa] p-4 font-sans pb-20">
      <nav className="max-w-4xl mx-auto h-16 bg-white rounded-xl shadow-sm flex items-center justify-between px-6 mb-8 border border-gray-100">
        <h1 className="text-xl font-black text-indigo-700">Account Profile</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate("/dashboard")} className="text-sm font-semibold text-gray-500 hover:bg-gray-50 border px-4 py-1.5 rounded-lg transition">Return</button>
          <UserButton />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Read Only Status Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 text-center">
            <div className="w-24 h-24 mx-auto bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg shadow-indigo-100 font-bold text-3xl">
              {user?.firstName?.[0] || "U"}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{user?.fullName || "User"}</h2>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{dbUser?.role}</p>

            <div className="mt-6 pt-6 border-t border-gray-50 space-y-3 text-left">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Email Address</p>
                <p className="text-sm font-bold text-gray-700 truncate">{dbUser?.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Account Created</p>
                <p className="text-sm font-bold text-gray-700">{new Date(dbUser?.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Form Card */}
        <div className="md:col-span-2">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black text-gray-800 mb-2 border-l-4 border-indigo-500 pl-3">Update Identity Information</h3>
            <p className="text-sm text-gray-500 mb-8 pl-4">Fill in the missing fields below. This data will be used to identify your submissions on the official platform Leaderboards.</p>

            <form onSubmit={handleSave} className="space-y-5 pl-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Legal Name</label>
                <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Rahul Sharma" className="w-full mt-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold outline-none focus:border-indigo-500 focus:bg-white transition" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">College Roll / Reg Number</label>
                <input name="roll_number" value={formData.roll_number} onChange={handleChange} placeholder="e.g. CEC231297" className="w-full mt-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-indigo-700 font-black uppercase tracking-wider outline-none focus:border-indigo-500 focus:bg-white transition" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Program / Dept</label>
                  <select disabled className="w-full mt-2 p-4 bg-gray-100/50 border border-gray-200 rounded-2xl text-gray-500 font-bold outline-none cursor-not-allowed appearance-none">
                    <option>Computer Science Engg.</option>
                    <option>Artificial Intelligence</option>
                    <option>Electronics Engg.</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Semester</label>
                  <input disabled value={getSem(formData.roll_number)} className="w-full mt-2 p-4 bg-gray-100/50 border border-gray-200 rounded-2xl text-emerald-600 font-bold outline-none cursor-not-allowed appearance-none" />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={saving} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition">
                  {saving ? "Saving Data..." : "Apply Profile Updates"}
                </button>
                <p className="text-[11px] text-gray-400 mt-3 font-semibold">* Note: You cannot edit your Email Address as it is locked strictly via Google OAuth Verification.</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
