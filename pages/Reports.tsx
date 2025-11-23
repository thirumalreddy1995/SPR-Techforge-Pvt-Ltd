
import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button } from '../components/Components';

export const Reports: React.FC = () => {
  const { exportData, importDatabase, isCloudEnabled } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'Data' | 'Info'>('Data');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        let warning = "You are about to restore the database from a backup file. This will OVERWRITE current local data.";
        if (isCloudEnabled) {
          warning += " Since Cloud is enabled, this will also upload the backup data to Firebase, potentially overwriting or adding to existing records.";
        }
        
        if (window.confirm(warning + "\n\nAre you sure you want to proceed?")) {
          await importDatabase(json);
        }
      } catch (err) {
        alert("Invalid JSON File. Please upload a valid backup file.");
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end">
          <h1 className="text-3xl font-bold text-gray-900">Data & Reports</h1>
          <div className="flex space-x-2">
             <button 
                onClick={() => setActiveTab('Data')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'Data' ? 'bg-spr-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
             >
               Backup & Restore
             </button>
             <button 
                onClick={() => setActiveTab('Info')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'Info' ? 'bg-spr-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
             >
               Database Info
             </button>
          </div>
       </div>
       
       {activeTab === 'Data' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          <Card title="Backup (Export)" className="h-full">
            <div className="space-y-4">
              <p className="text-gray-600">
                Download a complete copy of the system database. This JSON file contains all Candidates, Accounts, Transactions, Users, and Logs.
              </p>
              <div className="pt-4">
                <Button onClick={exportData}>
                    Download Full Database
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Restore (Import)" className="h-full">
              <div className="space-y-4">
                <p className="text-gray-600">
                  Upload a previously exported JSON file to restore the system state.
                </p>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm text-amber-800">
                  <strong>Warning:</strong> This action updates your current database with the data from the file.
                </div>
                <div className="pt-4">
                  <input 
                    type="file" 
                    accept=".json" 
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    Upload & Restore Backup
                  </Button>
                </div>
              </div>
          </Card>
        </div>
       )}

       {activeTab === 'Info' && (
         <div className="animate-fade-in">
            <Card title="Database Structure">
               <div className="text-gray-600 space-y-4">
                 <p>
                   The application currently uses a NoSQL structure (JSON-based).
                 </p>
                 {isCloudEnabled ? (
                   <div className="bg-orange-50 border border-orange-200 p-4 rounded text-orange-900">
                     <strong>Cloud Provider:</strong> Google Firebase (Firestore)<br/>
                     <strong>Status:</strong> Connected<br/>
                     <p className="mt-2 text-sm">Data is synced in real-time. Collections are created automatically (Schemaless).</p>
                   </div>
                 ) : (
                   <div className="bg-gray-100 border border-gray-300 p-4 rounded">
                     <strong>Storage:</strong> Local Browser Storage<br/>
                     <strong>Status:</strong> Offline Mode
                   </div>
                 )}
               </div>
            </Card>
         </div>
       )}
       
       <Card title="Analytics">
             <div className="h-32 flex items-center justify-center text-gray-400 font-medium bg-gray-50 rounded border border-gray-200 border-dashed">
               Advanced Graphical Reports Module (Coming Soon)
             </div>
       </Card>
    </div>
  );
};
