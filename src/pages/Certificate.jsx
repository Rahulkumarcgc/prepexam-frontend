import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export default function Certificate() {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  
  const score = searchParams.get("score");
  const date = searchParams.get("date") || new Date().toLocaleDateString();

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await fetch(`https://prepexam-backend.onrender.com/api/exams/${examId}`);
        const data = await res.json();
        if (data.success) setExamData(data.exam);
      } catch (e) { console.error(e); }
    };
    if (examId !== 'demo') fetchExam();
    else setExamData({ title: "Demo Proficiency Test" });
  }, [examId]);

  if (!isLoaded || !examData) return <div className="min-h-screen flex items-center justify-center font-bold text-indigo-600 animate-pulse text-2xl">Generating Your Achievement...</div>;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 flex flex-col items-center font-serif">
      {/* ACTION HEADER (HIDDEN IN PRINT) */}
      <div className="max-w-[1000px] w-full flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm print:hidden">
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition">← Back</button>
        <div className="text-center">
            <h1 className="text-xl font-black text-slate-800">Certificate Preview</h1>
            <p className="text-xs text-gray-400">Official PrepExam Accreditation</p>
        </div>
        <button onClick={handlePrint} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2-2v4a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print / Download PDF
        </button>
      </div>

      {/* THE ACTUAL CERTIFICATE */}
      <div className="certificate-container bg-white w-full max-w-[1000px] aspect-[1.414/1] relative p-12 shadow-2xl border-[16px] border-double border-indigo-900 overflow-hidden print:shadow-none print:border-black print:m-0">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full -ml-32 -mb-32 opacity-50"></div>
        
        {/* Content Area */}
        <div className="relative h-full border-4 border-indigo-200 p-8 flex flex-col items-center justify-between text-center print:border-black">
          
          {/* Header */}
          <div className="w-full">
            <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-indigo-900 rounded-full flex items-center justify-center text-white shadow-xl">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
            </div>
            <h2 className="text-4xl font-black text-indigo-900 uppercase tracking-[0.2em] mb-2 print:text-black">Certificate</h2>
            <h3 className="text-xl font-bold text-indigo-600 uppercase tracking-[0.4em] print:text-black">Of Achievement</h3>
          </div>

          {/* Main Body */}
          <div className="my-8">
            <p className="text-lg text-gray-500 italic mb-4">This is to certify that</p>
            <h4 className="text-5xl font-black text-slate-800 border-b-2 border-indigo-100 px-10 pb-2 inline-block mb-4 print:text-black print:border-black">{user.fullName || user.firstName || "Distinguished Student"}</h4>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              has successfully completed the examination for <br />
              <strong className="text-indigo-900 text-2xl print:text-black">"{examData.title}"</strong> <br />
              demonstrating exceptional proficiency and knowledge in the subject matter.
            </p>
          </div>

          {/* Footer Data */}
          <div className="w-full flex justify-between items-end px-10 mb-4">
            <div className="text-left">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Final Score</p>
                <p className="text-2xl font-black text-indigo-700 print:text-black">{score || "Passed"} / {examData.total_marks || "100"}</p>
                <div className="w-32 h-0.5 bg-indigo-900 mt-4 print:bg-black"></div>
                <p className="text-[10px] font-bold text-gray-400 mt-2">ASSESSMENT DATE: {date}</p>
            </div>
            
            <div className="text-center">
                <div className="w-24 h-24 border-4 border-indigo-100 rounded-full flex items-center justify-center mb-2 print:border-black">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-900 font-black text-xs print:bg-white print:text-black">SEAL</div>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">OFFICIAL SEAL</p>
            </div>

            <div className="text-right">
                <div className="w-48 h-0.5 bg-indigo-900 mb-2 print:bg-black ml-auto"></div>
                <p className="text-sm font-bold text-slate-800 print:text-black">Director of Academics</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">PrepExam Portal Authority</p>
            </div>
          </div>

          {/* Certificate ID */}
          <div className="absolute bottom-4 right-8">
            <p className="text-[8px] font-mono text-gray-300">CERT-ID: PX-{examId.substring(0,6)}-{user.id.substring(user.id.length-6)}</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { padding: 0; background: white; }
          .min-h-screen { min-height: auto; padding: 0; }
          .certificate-container { 
            box-shadow: none !important; 
            margin: 0 !important;
            width: 100%;
            height: 100vh;
            border-width: 10px !important;
          }
          header, footer, .print\\:hidden { display: none !important; }
        }
        @page {
          size: landscape;
          margin: 0;
        }
      `}} />
    </div>
  );
}
