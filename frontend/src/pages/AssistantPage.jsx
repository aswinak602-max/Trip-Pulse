import React from 'react';
import { Bot, Sparkles, Compass, MapPin, Calendar, DollarSign, CloudSun } from 'lucide-react';
import ChatBox from '../components/ChatBox';
import api from '../services/api';

export const AssistantPage = ({ trip, setActivePage }) => {
  const tripId = trip?.id || 1;
  const destination = trip?.destination || 'Ooty';

  const handleActionExecute = async (action) => {
    if (action.type === 'add_to_itinerary') {
      try {
        const placeName = action.payload?.place_name || 'Recommended Stop';
        const day = action.payload?.day || 1;
        await api.post('/itinerary', {
          trip_id: tripId,
          day_number: day,
          time_slot: '02:30 PM',
          custom_title: placeName,
          activity_type: 'attraction',
          duration_hours: 2.0,
          notes: 'Added via AI Tourist Assistant action proposal'
        });
        alert(`✓ Confirmed: "${placeName}" has been added to Day ${day} Itinerary!`);
        setActivePage('itinerary');
      } catch (err) {
        alert(err.message || 'Failed to add activity');
      }
    } else if (action.type === 'reduce_budget') {
      setActivePage('cost-prediction');
    } else if (action.type === 'optimize_route') {
      setActivePage('itinerary');
    }
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Context Banner */}
      <div className="glass-card" style={{
        background: 'var(--hero-gradient)',
        border: '1px solid var(--border)',
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-coral">
              <Sparkles size={12} /> Context-Aware LLM Concierge
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
            AI Travel Assistant
          </h1>
        </div>

        {/* Trip Context Badges */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span className="badge badge-teal" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
            <MapPin size={14} /> {trip?.current_location || 'Chennai'} → {destination}
          </span>
          <span className="badge badge-gold" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
            <DollarSign size={14} /> Budget: ₹{(trip?.budget || 25000).toLocaleString()}
          </span>
          <span className="badge badge-navy" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
            <Calendar size={14} /> {trip?.days_count || 3} Days • {trip?.members_count || 4} Travelers
          </span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <ChatBox 
        tripId={tripId} 
        destination={destination}
        onActionExecute={handleActionExecute}
        onPlanTrip={() => setActivePage('create-trip')}
      />

    </div>
  );
};

export default AssistantPage;
