
import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getHealthProfile, updateHealthProfile } from '../api/client';
import type { HealthProfile, ProfileUpdateRequest } from '../api/client';
import { Plus, Trash2, Save } from 'lucide-react';

export function Profile() {
    const [profile, setProfile] = useState<HealthProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [authToken, setAuthToken] = useState<string | undefined>(undefined);

    // Form State
    const [conditions, setConditions] = useState<string[]>([]);
    const [allergies, setAllergies] = useState<string[]>([]);
    const [medications, setMedications] = useState<{ name: string, dosage: string }[]>([]);
    const [basicInfo, setBasicInfo] = useState({ age: 0, gender: '', blood_type: '' });

    useEffect(() => {
        fetchAuthSession().then(session => {
            const token = session.tokens?.idToken?.toString();
            setAuthToken(token);
        });
    }, []);

    useEffect(() => {
        if (!authToken) return;
        loadProfile();
    }, [authToken]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await getHealthProfile(authToken!);
            setProfile(data);
            // Initialize form state
            setConditions(data.conditions.map(c => c.name || c));
            setAllergies(data.allergies.map(a => a.name || a));
            setMedications(data.medications.map(m => ({ name: m.name, dosage: m.dosage })));
            setBasicInfo({
                age: data.age || 0,
                gender: data.gender || '',
                blood_type: data.blood_type || ''
            });
        } catch (err) {
            setError('Failed to load profile');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!authToken) return;
        try {
            const updateData: ProfileUpdateRequest = {
                conditions: conditions,
                allergies: allergies,
                medications: medications,
                age: basicInfo.age,
                gender: basicInfo.gender,
                blood_type: basicInfo.blood_type
            };

            await updateHealthProfile(authToken, updateData);
            setEditMode(false);
            loadProfile(); // Reload to get processed data
        } catch (err) {
            setError('Failed to update profile');
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading profile...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Health Profile</h1>
                {!editMode ? (
                    <button
                        onClick={() => setEditMode(true)}
                        style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Edit Profile
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setEditMode(false)}
                            style={{ padding: '0.5rem 1rem', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                )}
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>{error}</div>}

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {/* Basic Info */}
                <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Basic Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Age</label>
                        {editMode ? (
                            <input
                                type="number"
                                value={basicInfo.age}
                                onChange={e => setBasicInfo({ ...basicInfo, age: parseInt(e.target.value) })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            />
                        ) : (
                            <div>{profile?.age || 'Not set'}</div>
                        )}
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Gender</label>
                        {editMode ? (
                            <select
                                value={basicInfo.gender}
                                onChange={e => setBasicInfo({ ...basicInfo, gender: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            >
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        ) : (
                            <div>{profile?.gender || 'Not set'}</div>
                        )}
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Blood Type</label>
                        {editMode ? (
                            <input
                                type="text"
                                value={basicInfo.blood_type}
                                onChange={e => setBasicInfo({ ...basicInfo, blood_type: e.target.value })}
                                placeholder="e.g. O+"
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            />
                        ) : (
                            <div>{profile?.blood_type || 'Not set'}</div>
                        )}
                    </div>
                </div>

                {/* Conditions */}
                <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Medical Conditions</h3>
                {editMode ? (
                    <div style={{ marginBottom: '2rem' }}>
                        {conditions.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                    value={item}
                                    onChange={e => {
                                        const newItems = [...conditions];
                                        newItems[idx] = e.target.value;
                                        setConditions(newItems);
                                    }}
                                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                />
                                <button onClick={() => setConditions(conditions.filter((_, i) => i !== idx))} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                            </div>
                        ))}
                        <button onClick={() => setConditions([...conditions, ''])} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}>
                            <Plus size={18} /> Add Condition
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                        {profile?.conditions.length ? (
                            profile.conditions.map((c, i) => (
                                <span key={i} style={{ background: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                                    {typeof c === 'string' ? c : c.name}
                                </span>
                            ))
                        ) : <div style={{ color: '#6b7280' }}>No conditions recorded</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
