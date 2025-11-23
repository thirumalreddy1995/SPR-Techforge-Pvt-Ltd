
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Logo, Input, Button, Modal } from '../components/Components';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login, updateUser, user, isCloudEnabled, cloudError, addPasswordResetRequest } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Password Change State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  useEffect(() => {
    // Only redirect if user exists AND they have changed their password
    if (user && user.isPasswordChanged !== false) {
      navigate('/dashboard');
    } else if (user && user.isPasswordChanged === false) {
       setShowChangePassword(true);
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const result = await login(username, password);
    
    if (result.success) {
       // Effect will handle navigation or password change UI
       setIsLoading(false); 
    } else {
      setError(result.message || 'Login failed');
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 4) {
      setError("Password is too short");
      return;
    }
    if (newPassword === user?.name) {
      setError("New password cannot be the same as your name");
      return;
    }

    if (user) {
      updateUser({
        ...user,
        password: newPassword,
        isPasswordChanged: true
      });
      // After update, the Effect hook will redirect to dashboard
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotUsername.trim()) {
      addPasswordResetRequest(forgotUsername);
      setForgotMsg("Request sent to Admin. Please contact Thirumal Reddy for your new password.");
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotMsg('');
        setForgotUsername('');
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Midnight Royal Blue Theme Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 bg-slate-50">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-200/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl"></div>
        <div className="absolute top-[40%] left-[40%] w-72 h-72 bg-sky-100/40 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md z-20">
        {cloudError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm animate-fade-in">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                 <h3 className="text-red-800 font-bold text-sm">Connectivity Issue</h3>
                 <p className="text-red-600 text-sm">{cloudError}</p>
                 {cloudError.includes('Permission') && (
                   <button onClick={() => navigate('/admin/cloud')} className="text-xs text-red-700 underline mt-1">Go to Cloud Setup for fix</button>
                 )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/80 border border-white/50 p-8 rounded-2xl shadow-2xl relative backdrop-blur-md">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          
          {!showChangePassword ? (
            <>
              <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Portal Login</h2>
              <p className="text-center text-slate-500 mb-6">
                Sign in to manage SPR Techforge
              </p>

              <form onSubmit={handleLogin}>
                <Input 
                  label="Username / Login ID" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  placeholder="e.g. name@sprtechforge.com"
                />
                <Input 
                  label="Password" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Enter password"
                />
                
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                
                <div className="flex justify-between items-center mb-6">
                   <button type="button" onClick={() => setShowForgotModal(true)} className="text-sm text-spr-accent hover:text-spr-accent_hover hover:underline font-medium">
                     Forgot Password?
                   </button>
                </div>

                <Button type="submit" className="w-full py-3 text-lg shadow-lg shadow-blue-100 hover:shadow-blue-200" disabled={isLoading}>
                  {isLoading ? 'Authenticating...' : 'Login'}
                </Button>
              </form>
            </>
          ) : (
            <div className="animate-fade-in">
               <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Secure Your Account</h2>
               <p className="text-center text-slate-500 mb-6 text-sm">
                 This is your first login. Please set a new, secure password to continue to the dashboard.
               </p>

               <form onSubmit={handlePasswordUpdate}>
                 <Input 
                    label="New Password" 
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                 />
                 <Input 
                    label="Confirm Password" 
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                 />

                 {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

                 <Button type="submit" className="w-full py-3 text-lg shadow-lg shadow-blue-100">
                    Update Password & Login
                 </Button>
               </form>
            </div>
          )}

          <div className="mt-6 text-center">
             <p className="text-xs text-slate-400">
               &copy; 2025 SPR Techforge Pvt Ltd. All rights reserved.
               {isCloudEnabled && <span className="block mt-1 text-slate-500 font-bold flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Cloud Connected</span>}
             </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} title="Reset Password">
         {!forgotMsg ? (
           <form onSubmit={handleForgotSubmit}>
             <p className="text-gray-600 mb-4">
               Enter your Login ID below. The administrator will be notified to reset your password.
             </p>
             <Input 
               label="Your Username / Login ID"
               value={forgotUsername}
               onChange={e => setForgotUsername(e.target.value)}
               placeholder="e.g. john@sprtechforge.com"
               required
             />
             <div className="flex justify-end gap-2 mt-4">
               <Button type="button" variant="secondary" onClick={() => setShowForgotModal(false)}>Cancel</Button>
               <Button type="submit">Send Request</Button>
             </div>
           </form>
         ) : (
           <div className="text-center py-4">
             <div className="text-spr-accent font-bold text-lg mb-2">Request Sent</div>
             <p className="text-gray-600">{forgotMsg}</p>
           </div>
         )}
      </Modal>
    </div>
  );
};
