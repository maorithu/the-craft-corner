'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authenticateAdminStaff, getStaffDirectory, type StaffProfile } from '@/lib/staffAuth';
import { sound } from '@/utils/soundEffects';

export default function AdminStaffPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffProfile | null>(null);
  const [staffDirectory, setStaffDirectory] = useState<StaffProfile[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState('Packager');
  const [formDepartment, setFormDepartment] = useState('Operations');
  const [formIcon, setFormIcon] = useState('👤');
  const [formDescription, setFormDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadStaffDirectory = async () => {
    const members = await getStaffDirectory();
    setStaffDirectory(members);
  };

  useEffect(() => {
    loadStaffDirectory();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(false);

    try {
      const authenticated = await authenticateAdminStaff(username, password);
      if (!authenticated) {
        setLoginError(true);
        return;
      }

      setCurrentStaff(authenticated);
      setIsAuthenticated(true);
      sound.playFanfare();
      setUsername('');
      setPassword('');
      await loadStaffDirectory();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formPassword || !formFullName.trim()) {
      setNotice('Username, password, and full name are required.');
      return;
    }

    setIsSaving(true);
    setNotice(null);

    try {
      const response = await fetch('/api/staff-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formUsername,
          password: formPassword,
          fullName: formFullName,
          role: formRole,
          department: formDepartment,
          icon: formIcon,
          description: formDescription,
          permissions: ['manage_orders'],
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setNotice(result.error || 'Could not create staff member.');
        return;
      }

      setFormUsername('');
      setFormPassword('');
      setFormFullName('');
      setFormRole('Packager');
      setFormDepartment('Operations');
      setFormIcon('👤');
      setFormDescription('');
      setNotice(`Created ${result.staff?.name || formFullName}.`);
      await loadStaffDirectory();
      sound.playFanfare();
    } catch {
      setNotice('Something went wrong while creating the staff account.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="home-container admin-inventory-container">
        <div className="staff-lock-screen">
          <div className="staff-lock-card">
            <div className="lock-icon-badge">👥 🔒</div>
            <h2>Staff Management</h2>
            <p>Sign in with a valid staff account to add or manage team members.</p>

            <form onSubmit={handleLogin} className="staff-login-form">
              <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                <label htmlFor="staff-manager-username" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px' }}>
                  Username:
                </label>
                <input
                  id="staff-manager-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setLoginError(false);
                  }}
                  required
                  className="staff-passcode-input"
                  autoComplete="username"
                  placeholder="Enter staff username"
                />
              </div>

              <div style={{ marginBottom: '14px', textAlign: 'left' }}>
                <label htmlFor="staff-manager-password" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px' }}>
                  Password:
                </label>
                <input
                  id="staff-manager-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError(false);
                  }}
                  required
                  className="staff-passcode-input"
                  autoComplete="current-password"
                  placeholder="Enter staff password"
                />
              </div>

              {loginError && (
                <div style={{ marginBottom: '12px', color: '#b91c1c', fontWeight: 700 }}>
                  Invalid username or password.
                </div>
              )}

              <button type="submit" className="primary-button" disabled={isLoggingIn}>
                {isLoggingIn ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div style={{ marginTop: '18px' }}>
              <Link href="/admin/inventory" className="text-link">
                ← Back to Inventory
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container admin-inventory-container">
      <div className="staff-lock-card" style={{ maxWidth: '1100px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800, opacity: 0.7 }}>
              Staff Portal
            </div>
            <h2 style={{ margin: '6px 0 0' }}>Manage Staff</h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700 }}>Signed in as {currentStaff?.name || 'Staff'}</span>
            <Link href="/admin/inventory" className="text-link">
              Inventory
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 420px) minmax(0, 1fr)', gap: '24px' }}>
          <form onSubmit={handleCreateStaff} style={{ border: '1px solid #e5e7eb', borderRadius: '16px', padding: '20px', background: '#fff', display: 'grid', gap: '12px' }}>
            <h3 style={{ margin: 0 }}>Add new staff</h3>

            <label>
              <span style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Username</span>
              <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} required className="staff-passcode-input" />
            </label>

            <label>
              <span style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Password</span>
              <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} required className="staff-passcode-input" />
            </label>

            <label>
              <span style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Full name</span>
              <input type="text" value={formFullName} onChange={(e) => setFormFullName(e.target.value)} required className="staff-passcode-input" />
            </label>

            <label>
              <span style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Role</span>
              <input type="text" value={formRole} onChange={(e) => setFormRole(e.target.value)} className="staff-passcode-input" />
            </label>

            <label>
              <span style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Department</span>
              <input type="text" value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} className="staff-passcode-input" />
            </label>

            <label>
              <span style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Icon</span>
              <input type="text" value={formIcon} onChange={(e) => setFormIcon(e.target.value)} className="staff-passcode-input" />
            </label>

            <label>
              <span style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Description</span>
              <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={4} className="staff-passcode-input" style={{ resize: 'vertical' }} />
            </label>

            {notice && (
              <div style={{ color: notice.includes('Created') ? '#166534' : '#b91c1c', fontWeight: 700 }}>
                {notice}
              </div>
            )}

            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create staff'}
            </button>
          </form>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', padding: '20px', background: '#fff' }}>
            <h3 style={{ marginTop: 0 }}>Current staff</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {staffDirectory.length === 0 ? (
                <div>No staff members yet.</div>
              ) : (
                staffDirectory.map((member) => (
                  <div key={member.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 14px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.6rem' }}>{member.icon || '👤'}</span>
                      <div>
                        <div style={{ fontWeight: 800 }}>{member.name}</div>
                        <div style={{ fontSize: '0.82rem', opacity: 0.7 }}>{member.username}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      <strong>{member.role}</strong> · {member.deptName}
                    </div>
                    {member.description && (
                      <div style={{ marginTop: '8px', fontSize: '0.85rem', opacity: 0.8 }}>{member.description}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
