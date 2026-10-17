import { useState } from 'react';
import { saveRecordLocally } from '../services/db';

export default function HealthForm({ onRecordSaved }) {
  const [formData, setFormData] = useState({
    chw_id: '',
    patient_name: '',
    village_name: '',
    visit_type: '',
    visit_bp: '',
    visit_temp: '',
    urgency_level: '',
    visit_notes: ''
  });

  const [ statusMessage, setStatusMessage ] = useState(null);
  const [ isSubmitting, setIsSubmitting ] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
        await saveRecordLocally(formData);
        setStatusMessage({
            type: 'success',
            text: navigator.onLine
                ? 'Visit saved. Syncing to Supabase automatically.'
                : 'Visit saved on this device. It will sync automatically when you reconnect.',
        });

        setFormData({
            chw_id: '',
            patient_name: '',
            village_name: '',
            visit_type: '',
            visit_bp: '',
            visit_temp: '',
            urgency_level: '',
            visit_notes: ''
        });

        if (onRecordSaved) onRecordSaved();
    } catch (error) {
        console.error('Error saving record locally:', error);
        setStatusMessage({ type: 'error', text: 'Failed to save record locally.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2 className="panel-title">Record a health visit</h2>
        <p className="panel-description">Your visit is saved on this device and queued to sync.</p>
      </div>

      <form onSubmit={handleSubmit} className="health-form">
        <div className="form-fields">
          <label className="field" htmlFor="chw_id">
            <span className="field-label">Community health worker ID</span>
            <input id="chw_id" type="text" name="chw_id" value={formData.chw_id} onChange={handleChange} className="field-input" placeholder="e.g. CHW-042" required />
          </label>

          <label className="field" htmlFor="patient_name">
            <span className="field-label">Patient name</span>
            <input id="patient_name" type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} className="field-input" placeholder="Full name" required />
          </label>

          <label className="field" htmlFor="village_name">
            <span className="field-label">Village</span>
            <input id="village_name" type="text" name="village_name" value={formData.village_name} onChange={handleChange} className="field-input" placeholder="Village or community" required />
          </label>

          <label className="field" htmlFor="visit_type">
            <span className="field-label">Visit type</span>
            <select id="visit_type" name="visit_type" value={formData.visit_type} onChange={handleChange} className="field-select" required>
              <option value="General">General</option>
              <option value="Maternal">Maternal</option>
              <option value="Child">Child</option>
            </select>
          </label>

          <label className="field" htmlFor="visit_bp">
            <span className="field-label">Blood pressure</span>
            <input id="visit_bp" type="text" name="visit_bp" placeholder="e.g. 120/80" value={formData.visit_bp} onChange={handleChange} className="field-input" />
          </label>

          <label className="field" htmlFor="visit_temp">
            <span className="field-label">Temperature (°C)</span>
            <input id="visit_temp" type="number" step="0.1" min="35.0" max="42.0" name="visit_temp" placeholder="e.g. 36.8" value={formData.visit_temp} onChange={handleChange} className="field-input" />
          </label>

          <label className="field field-wide" htmlFor="urgency_level">
            <span className="field-label">Urgency level</span>
            <select id="urgency_level" name="urgency_level" value={formData.urgency_level} onChange={handleChange} className="field-select" required>
              <option value="">Select urgency</option>
              <option value="Routine">Routine</option>
              <option value="Urgent">Urgent</option>
              <option value="Emergency">Emergency</option>
            </select>
          </label>

          <label className="field field-wide" htmlFor="visit_notes">
            <span className="field-label">Visit notes</span>
            <textarea id="visit_notes" name="visit_notes" rows="3" placeholder="Add relevant observations or follow-up notes" value={formData.visit_notes} onChange={handleChange} className="field-textarea" />
          </label>
        </div>

        {statusMessage && (
          <p className={`form-message ${statusMessage.type === 'error' ? 'error' : ''}`} role="status">
            {statusMessage.text}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className="primary-button">
          {isSubmitting ? 'Saving visit…' : 'Save visit'}
        </button>
        </form>
    </section>
  );
}