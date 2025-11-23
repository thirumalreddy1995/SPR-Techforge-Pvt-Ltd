
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button, Logo } from '../../components/Components';

export const CandidateAgreement: React.FC = () => {
  const { candidates } = useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const candidate = candidates.find(c => c.id === id);

  if (!candidate) {
    return <div className="p-8 text-white">Candidate not found</div>;
  }

  return (
    <div className="bg-white min-h-screen text-black p-8">
      {/* No-print controls */}
      <div className="print:hidden mb-8 flex justify-between items-center bg-gray-100 p-4 rounded-lg border border-gray-300">
        <Button variant="secondary" onClick={() => navigate(-1)} className="text-gray-800">Back</Button>
        <div className="flex gap-2">
           <Button onClick={() => window.print()}>Print / Save PDF</Button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="max-w-3xl mx-auto print:w-full">
        <div className="flex items-center justify-between mb-8 border-b-2 border-indigo-600 pb-4">
           <div className="flex items-center gap-3">
               {/* Reusing Logo SVG but styling for print/white bg */}
               <div className="w-12 h-12 flex items-center justify-center bg-indigo-600 rounded-lg">
                   <svg className="text-white w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
               </div>
               <div>
                   <h1 className="text-2xl font-bold text-indigo-900">SPR Techforge Pvt Ltd</h1>
                   <p className="text-sm text-gray-500">Excellence in Training & Placement</p>
               </div>
           </div>
           <div className="text-right text-sm text-gray-600">
             <p>Date: {new Date().toLocaleDateString()}</p>
             <p>Ref: {candidate.batchId}</p>
           </div>
        </div>

        <div className="mb-8">
           <h2 className="text-xl font-bold text-center uppercase underline mb-6">Candidature Training Agreement</h2>
           
           <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded border border-gray-200">
              <div>
                 <p className="text-xs text-gray-500 uppercase">Candidate Name</p>
                 <p className="font-bold text-lg">{candidate.name}</p>
              </div>
              <div>
                 <p className="text-xs text-gray-500 uppercase">Batch ID</p>
                 <p className="font-bold text-lg">{candidate.batchId}</p>
              </div>
              <div>
                 <p className="text-xs text-gray-500 uppercase">Contact</p>
                 <p>{candidate.phone}</p>
                 <p>{candidate.email}</p>
              </div>
              <div>
                 <p className="text-xs text-gray-500 uppercase">Address</p>
                 <p className="whitespace-pre-wrap">{candidate.address || 'N/A'}</p>
              </div>
           </div>

           <div className="prose max-w-none">
              {/* Preserving whitespace for agreement text */}
              <div className="whitespace-pre-wrap font-serif text-justify leading-relaxed text-gray-800">
                 {candidate.agreementText || "No agreement text provided."}
              </div>
           </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-10">
           <div className="border-t border-black pt-2 text-center">
             <p className="font-bold">SPR Techforge Representative</p>
             <p className="text-xs text-gray-500">(Authorized Signatory)</p>
           </div>
           <div className="border-t border-black pt-2 text-center">
             <p className="font-bold">{candidate.name}</p>
             <p className="text-xs text-gray-500">(Candidate Signature)</p>
           </div>
        </div>

        <div className="mt-12 text-center text-xs text-gray-400 print:fixed print:bottom-4 print:w-full">
           <p>SPR Techforge Pvt Ltd | Registered Office Address Here | Contact: contact@sprtechforge.com</p>
        </div>
      </div>
    </div>
  );
};
