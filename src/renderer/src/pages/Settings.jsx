import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Building2, Mail, Phone, MapPin, CreditCard, Save, Upload, User, Shield, HardDrive, Users, Trash2, Plus, Edit, CheckCircle, XCircle } from 'lucide-react';

const Settings = ({ section = 'profile' }) => {
  const { showNotification, settings, refreshSettings, user, users, refreshUsers } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [userForm, setUserForm] = useState({ username: '', password: '', confirmPassword: '', role: 'Staff' });

  const [profile, setProfile] = useState({
    company_name: '',
    company_address: '',
    company_email: '',
    company_phone: '',
    company_gst: '',
    company_pan: '',
    company_logo: '',
    bank_name: '',
    bank_account: '',
    bank_ifsc: ''
  });

  useEffect(() => {
    fetchSettings();
    refreshUsers();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    try {
      const res = await window.api.changePassword({
        username: user?.username || 'admin',
        oldPassword: passwordForm.old,
        newPassword: passwordForm.new
      });
      if (res.success) {
        showNotification('Password changed successfully', 'success');
        setIsPasswordModalOpen(false);
        setPasswordForm({ old: '', new: '', confirm: '' });
      } else {
        showNotification(res.message, 'error');
      }
    } catch (err) {
      showNotification('Error changing password', 'error');
    }
  };
  const fetchSettings = async () => {
    try {
      const data = await window.api.getSettings();
      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      showNotification('Failed to load settings', 'error');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (userForm.password !== userForm.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    try {
      const res = await window.api.addUser({
        username: userForm.username,
        password: userForm.password,
        role: userForm.role
      });
      if (res.success) {
        showNotification('User added successfully', 'success');
        setIsUserModalOpen(false);
        setUserForm({ username: '', password: '', confirmPassword: '', role: 'Staff' });
        refreshUsers();
      } else {
        showNotification(res.message, 'error');
      }
    } catch (err) {
      showNotification('Error adding user', 'error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (userForm.password && userForm.password !== userForm.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    try {
      const res = await window.api.updateUser({
        id: editingUser.id,
        username: userForm.username,
        role: userForm.role,
        password: userForm.password || null
      });
      if (res.success) {
        showNotification('User updated successfully', 'success');
        setIsUserModalOpen(false);
        setEditingUser(null);
        setUserForm({ username: '', password: '', confirmPassword: '', role: 'Staff' });
        refreshUsers();
      } else {
        showNotification(res.message, 'error');
      }
    } catch (err) {
      showNotification('Error updating user', 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await window.api.deleteUser(id);
      if (res.success) {
        showNotification('User deleted', 'success');
        refreshUsers();
      }
    } catch (err) {
      showNotification('Error deleting user', 'error');
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      const res = await window.api.toggleUserStatus({ id, isActive: !currentStatus });
      if (res.success) {
        showNotification(`User ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
        refreshUsers();
      }
    } catch (err) {
      showNotification('Error updating status', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation: Type and Size (2MB)
    if (!file.type.startsWith('image/')) {
      showNotification('Please upload an image file (PNG, JPG)', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showNotification('Image size should be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result; // Full Data URI: data:image/...;base64,...
      setProfile(prev => ({ ...prev, company_logo: base64Data }));
      setHasChanges(true);
      showNotification('Logo preview updated. Save to apply.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const saveSettings = async () => {
    if (!profile.company_name) {
      showNotification('Company name is required', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await window.api.updateSettings(profile);
      if (res.success) {
        showNotification('Profile updated successfully', 'success');
        setHasChanges(false);
      } else {
        showNotification(res.message, 'error');
      }
    } catch (err) {
      showNotification('Save failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', maxWidth: '900px' }}>
      {section === 'profile' && (
        <div className="card" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--premium-shadow)', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--accent-secondary)', padding: '10px', borderRadius: '12px', color: 'var(--accent-primary)' }}>
                <User size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Business Identity</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage your public business profile and branding</p>
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              disabled={!hasChanges || isLoading}
              onClick={saveSettings}
              style={{ gap: '8px', padding: '10px 24px', opacity: (!hasChanges || isLoading) ? 0.6 : 1 }}
            >
              <Save size={18} /> {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Company Name <span className="required">*</span></label>
              <input 
                name="company_name" 
                value={profile.company_name} 
                onChange={handleInputChange} 
                placeholder="e.g. Billify Solutions Pvt Ltd" 
                style={{ fontSize: '1.1rem', fontWeight: '700' }}
              />
            </div>

            <div className="form-group">
              <label>Company Logo</label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.5rem', 
                background: '#f9fafb', 
                padding: '1.25rem', 
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
              }}>
                <div 
                  className="logo-preview-container"
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '16px', 
                    background: 'white', 
                    border: '2px dashed var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => document.getElementById('logo-upload').click()}
                >
                  {profile.company_logo ? (
                    <>
                      <img src={profile.company_logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      <div className="logo-hover-overlay" style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        opacity: 0,
                        transition: 'opacity 0.2s'
                      }}>
                        CHANGE
                      </div>
                    </>
                  ) : (
                    <Building2 size={32} style={{ opacity: 0.2 }} />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: '0.85rem', background: 'white', margin: 0 }}>
                    <Upload size={16} style={{ marginRight: '8px' }} /> Upload Logo
                    <input id="logo-upload" type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                  </label>
                  {profile.company_logo && (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => {
                        setProfile(prev => ({ ...prev, company_logo: '' }));
                        setHasChanges(true);
                      }}
                      style={{ fontSize: '0.85rem', color: 'var(--error)', borderColor: '#fecaca' }}
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>GST Number</label>
              <input 
                name="company_gst" 
                value={profile.company_gst} 
                onChange={handleInputChange} 
                placeholder="22AAAAA0000A1Z5" 
              />
              <p className="helper-text">Enter your 15-digit GSTIN for tax compliance</p>
            </div>

            <div className="form-group">
              <label>PAN Number</label>
              <input 
                name="company_pan" 
                value={profile.company_pan} 
                onChange={handleInputChange} 
                placeholder="ABCDE1234F" 
              />
            </div>

            <div className="form-group">
              <label>Business Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  name="company_email" 
                  value={profile.company_email} 
                  onChange={handleInputChange} 
                  placeholder="contact@business.com" 
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  name="company_phone" 
                  value={profile.company_phone} 
                  onChange={handleInputChange} 
                  placeholder="+91 98765 43210" 
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Office Address</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-secondary)' }} />
                <textarea 
                  name="company_address" 
                  value={profile.company_address} 
                  onChange={handleInputChange} 
                  rows="3" 
                  placeholder="Full office or warehouse address..." 
                  style={{ paddingLeft: '2.75rem' }}
                ></textarea>
              </div>
            </div>
            
            <div style={{ gridColumn: 'span 2', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '12px', color: '#d97706' }}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Bank Settlement Details</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Used for invoice footers and payment instructions</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input name="bank_name" value={profile.bank_name} onChange={handleInputChange} placeholder="e.g. State Bank of India" />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input name="bank_account" value={profile.bank_account} onChange={handleInputChange} placeholder="Account Number" />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input name="bank_ifsc" value={profile.bank_ifsc} onChange={handleInputChange} placeholder="IFSC" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {section === 'security' && (
        <div className="card" style={{ padding: '3rem', background: 'white', borderRadius: '24px', boxShadow: 'var(--premium-shadow)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2.5rem' }}>
            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '14px', color: '#ef4444' }}>
              <Shield size={32} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Security Settings</h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Manage admin access and application protection</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1e293b' }}>Login Protection</div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Require password to access the application</p>
                  </div>
                  <button 
                    className={`btn ${settings?.auth_enabled ? 'btn-primary' : 'btn-outline'}`}
                    onClick={async () => {
                      const res = await window.api.toggleAuth(!settings.auth_enabled);
                      if (res.success) {
                        refreshSettings();
                        showNotification(`Login protection ${!settings.auth_enabled ? 'enabled' : 'disabled'}`, 'success');
                      }
                    }}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    {settings?.auth_enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1e293b' }}>User Management</div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Manage roles and access for staff members</p>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setEditingUser(null);
                      setUserForm({ username: '', password: '', confirmPassword: '', role: 'Staff' });
                      setIsUserModalOpen(true);
                    }}
                    style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}
                  >
                    <Plus size={16} /> Add User
                  </button>
                </div>

                <div className="table-container" style={{ margin: 0, background: 'white', borderRadius: '12px' }}>
                  <table style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: '700' }}>{u.username}</td>
                          <td>
                            <span style={{ 
                              padding: '4px 8px', 
                              borderRadius: '6px', 
                              background: u.role?.toLowerCase() === 'admin' ? '#eff6ff' : '#f8fafc',
                              color: u.role?.toLowerCase() === 'admin' ? '#2563eb' : '#64748b',
                              fontWeight: '700',
                              fontSize: '0.7rem'
                            }}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div 
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                              onClick={() => toggleUserStatus(u.id, u.is_active)}
                            >
                              {u.is_active ? (
                                <><CheckCircle size={14} color="#10b981" /> <span style={{ color: '#10b981', fontWeight: '600' }}>Active</span></>
                              ) : (
                                <><XCircle size={14} color="#ef4444" /> <span style={{ color: '#ef4444', fontWeight: '600' }}>Inactive</span></>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '4px' }}
                                onClick={() => {
                                  setEditingUser(u);
                                  setUserForm({ username: u.username, password: '', confirmPassword: '', role: u.role });
                                  setIsUserModalOpen(true);
                                }}
                              >
                                <Edit size={14} />
                              </button>
                              {u.username !== user?.username && (
                                <button 
                                  className="btn btn-outline" 
                                  style={{ padding: '4px', color: '#ef4444' }}
                                  onClick={() => handleDeleteUser(u.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '800' }}>System Information</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>App Version</span>
                  <span style={{ fontWeight: '700' }}>v1.2.0-stable</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>DB Engine</span>
                  <span style={{ fontWeight: '700' }}>Better SQLite3</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Environment</span>
                  <span style={{ fontWeight: '700', color: '#10b981' }}>Production</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Last Backup</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>Today</span>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Powered by</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--accent-primary)', letterSpacing: '0.05em' }}>BILLIFY ENGINE</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {section === 'backup' && (
        <div className="card" style={{ padding: '3rem', background: 'white', borderRadius: '24px', boxShadow: 'var(--premium-shadow)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2.5rem' }}>
            <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '14px', color: '#3b82f6' }}>
              <HardDrive size={32} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Backup & Sync</h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Protect your business data with local and cloud backups</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#1e293b' }}>Local Database Backup</div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Generate a full copy of your current database including all invoices, items, and customer history. 
                Keep this file safe in an external drive.
              </p>
              <button 
                className="btn btn-primary" 
                onClick={async () => {
                  try {
                    const res = await window.api.exportDatabase();
                    if (res.success) {
                      showNotification(`Backup saved to: ${res.path}`, 'success');
                    }
                  } catch (err) {
                    showNotification('Backup failed: ' + err.message, 'error');
                  }
                }}
                style={{ width: '100%', padding: '12px', borderRadius: '12px' }}
              >
                Create Local Backup
              </button>
            </div>

            <div style={{ padding: '2rem', background: '#f0f9ff', borderRadius: '20px', border: '1px solid #bae6fd' }}>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#0369a1' }}>Cloud Data Sync</div>
              <p style={{ fontSize: '0.85rem', color: '#0c4a6e', marginBottom: '1.5rem', lineHeight: '1.6', opacity: 0.8 }}>
                Synchronize your billing data across multiple devices securely. 
                This ensures you never lose access to your records.
              </p>
              <button className="btn btn-outline" disabled style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'white' }}>
                Configure Cloud Sync
              </button>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#0369a1', fontWeight: '700', textAlign: 'center' }}>
                PREMIUM FEATURE
              </div>
            </div>
          </div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Change Admin Password</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Old Password</label>
                <input 
                  type="password" 
                  required 
                  value={passwordForm.old}
                  onChange={e => setPasswordForm({ ...passwordForm, old: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  required 
                  value={passwordForm.new}
                  onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  required 
                  value={passwordForm.confirm}
                  onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsPasswordModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', padding: '2.5rem' }}>
            <h3 style={{ margin: '0 0 4px 0' }}>{editingUser ? 'Edit User' : 'Add New User'}</h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {editingUser ? 'Update user details and optionally change password' : 'Create a new account for staff or administrators'}
            </p>
            <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={userForm.username} 
                  onChange={e => setUserForm({...userForm, username: e.target.value})}
                  required 
                  placeholder="Enter username"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  value={userForm.role} 
                  onChange={e => setUserForm({...userForm, role: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                >
                  <option value="Staff">Staff (Billing & Inventory)</option>
                  <option value="Admin">Admin (Full Control)</option>
                </select>
              </div>
              <div className="form-group">
                <label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                <input 
                  type="password" 
                  value={userForm.password} 
                  onChange={e => setUserForm({...userForm, password: e.target.value})}
                  required={!editingUser}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  value={userForm.confirmPassword} 
                  onChange={e => setUserForm({...userForm, confirmPassword: e.target.value})}
                  required={!!userForm.password}
                  placeholder="••••••••"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingUser ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
