
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button } from '../../components/Components';
import { cloudService } from '../../services/cloud';

export const CloudSetup: React.FC = () => {
  const { isCloudEnabled, syncLocalToCloud, cloudError } = useApp();
  const [configJson, setConfigJson] = useState('');
  const [dbStatus, setDbStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [statusMsg, setStatusMsg] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const current = cloudService.getConfig();
    if (current) {
      setConfigJson(JSON.stringify(current, null, 2));
      // Assume connected if config exists, real connectivity is tested via listeners
      setDbStatus('connected'); 
    }
    // If there is a global error, show it
    if (cloudError) {
        setDbStatus('error');
        setStatusMsg(cloudError);
        // Automatically show rules if it is a permission error
        if (cloudError.includes('Permission')) setShowRules(true);
    }
  }, [cloudError]);

  const handleConnect = async () => {
    setStatusMsg('');
    setDbStatus('unknown');
    
    if (!configJson.trim()) {
      setStatusMsg("Please paste the Firebase Configuration JSON.");
      setDbStatus('error');
      return;
    }

    setIsTesting(true);
    // Test the raw credentials
    const result = await cloudService.testConfig(configJson);
    setIsTesting(false);

    if (result.success) {
       // Connection valid
       try {
         const parsed = JSON.parse(configJson);
         cloudService.saveConfig(parsed);
         setDbStatus('connected');
         setStatusMsg("Configuration Saved. App will reload.");
       } catch(e) {
         setDbStatus('error');
         setStatusMsg("Invalid JSON syntax.");
       }
    } else {
       setDbStatus('error');
       setStatusMsg(result.error || "Connection verification failed.");
       if (result.error?.includes('permission')) setShowRules(true);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm("Are you sure? This will disconnect the app from Firebase and revert to Local Storage.")) {
      cloudService.clearConfig();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold text-gray-900">Cloud Setup</h1>
             {/* Google Firebase Logo Icon */}
             <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.89 15.67L6.47 4.08C6.56 3.66 7.11 3.55 7.36 3.89L10.94 8.89L3.89 15.67Z" fill="#FFC107"/>
                <path d="M15.56 8.89L19.14 3.89C19.39 3.55 19.94 3.66 20.03 4.08L22.61 15.67H3.89L15.56 8.89Z" fill="#FFC107"/>
                <path d="M13.25 2.3L11.81 0.32C11.56 -0.02 11.09 -0.02 10.84 0.32L9.4 2.3C9.23 2.54 9.29 2.86 9.53 3.02L10.94 3.96L12.35 3.02C12.59 2.86 12.65 2.54 12.48 2.3H13.25Z" fill="#FFC107"/>
                <path d="M3.89 15.67H22.61L14.62 20.23C13.98 20.59 13.2 20.67 12.5 20.45L11.73 20.21L3.89 15.67Z" fill="#FFA000"/>
             </svg>
         </div>
         <div className="flex items-center gap-2">
             {dbStatus === 'connected' && <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold border border-orange-200 flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></span> Firebase Connected
             </span>}
             {dbStatus === 'error' && <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold border border-red-200">Connection Failed</span>}
         </div>
      </div>

      {/* RULES HELP SECTION */}
      {showRules && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-amber-900 font-bold text-lg mb-2">Missing Permissions?</h3>
                    <p className="text-amber-800 text-sm mb-2">
                        It looks like your Firestore Security Rules are blocking the application. 
                        Since this app manages users internally, you need to enable <strong>Test Mode</strong> or allow public read/write in the Firebase Console.
                    </p>
                    <p className="text-amber-800 text-sm font-bold mb-2">Go to Firebase Console &gt; Firestore Database &gt; Rules and paste this:</p>
                </div>
                <button onClick={() => setShowRules(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="bg-gray-900 p-3 rounded text-gray-100 font-mono text-xs overflow-x-auto relative group">
<pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}</pre>
                 <button 
                    onClick={() => navigator.clipboard.writeText(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`)}
                    className="absolute top-2 right-2 bg-white text-gray-900 px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                    Copy
                 </button>
            </div>
        </div>
      )}

      <Card title="Firebase Configuration">
        <div className="space-y-4">
          <p className="text-gray-600">
            Connect this application to <strong>Google Firebase (Firestore)</strong> for real-time data synchronization and cloud backup.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm text-blue-900">
              <strong>How to get configuration:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Go to <a href="https://console.firebase.google.com/" target="_blank" className="underline font-bold">Firebase Console</a>.</li>
                  <li>Open your Project Settings (Gear Icon).</li>
                  <li>Scroll down to "Your apps" and select the Web App.</li>
                  <li>Copy the <code>firebaseConfig</code> object (the part inside the curly braces).</li>
              </ol>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Config Object (JSON)</label>
             <textarea 
               className="w-full bg-gray-900 text-green-400 font-mono text-xs border border-spr-700 rounded-lg px-4 py-4 focus:ring-1 focus:ring-spr-accent outline-none h-64"
               value={configJson}
               onChange={e => setConfigJson(e.target.value)}
               placeholder={`{
  "apiKey": "AIza...",
  "authDomain": "project-id.firebaseapp.com",
  "projectId": "project-id",
  "storageBucket": "project-id.appspot.com",
  "messagingSenderId": "...",
  "appId": "..."
}`}
             ></textarea>
          </div>
          
          {dbStatus === 'error' && <div className="bg-red-50 border border-red-200 p-3 rounded mt-2 text-red-700 text-sm"><strong>Error:</strong> {statusMsg}</div>}
          
          <div className="flex justify-end gap-4 mt-4">
             <Button variant="secondary" onClick={() => setShowRules(!showRules)}>
                 {showRules ? 'Hide Rules Help' : 'Troubleshoot Permissions'}
             </Button>
             {isCloudEnabled && (
               <Button variant="danger" onClick={handleDisconnect}>Disconnect</Button>
             )}
             <Button onClick={handleConnect} disabled={isTesting}>
                {isTesting ? 'Verifying...' : (isCloudEnabled ? 'Update & Reconnect' : 'Connect & Save')}
             </Button>
          </div>
        </div>
      </Card>

      {/* Sync Section */}
      {isCloudEnabled && dbStatus === 'connected' && !cloudError && (
        <Card title="Data Synchronization">
           <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900">Upload Local Data</h4>
                <p className="text-sm text-gray-500">
                    Push your current local browser data to Firestore. 
                    <br/>
                    <span className="text-xs text-orange-600 font-bold">Note: Firestore creates collections automatically. No SQL setup required.</span>
                </p>
              </div>
              <Button variant="secondary" onClick={syncLocalToCloud}>Sync Local -&gt; Cloud</Button>
           </div>
        </Card>
      )}
    </div>
  );
};
