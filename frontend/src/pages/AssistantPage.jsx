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
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Context Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(30, 58, 138, 0.35) 50%, rgba(17, 24, 39, 0.9) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        padding: '20px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-info" style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6' }}>
              <Sparkles size={12} /> Context-Aware LLM Travel Intelligence
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            AI Tourist Assistant
          </h1>
        </div>

        {/* Trip Context Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-info" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            <MapPin size={13} /> {trip?.current_location || 'Chennai'} → {destination}
          </span>
          <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            <DollarSign size={13} /> Budget: ₹{(trip?.budget || 25000).toLocaleString()}
          </span>
          <span className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            <Calendar size={13} /> {trip?.days_count || 3} Days • {trip?.members_count || 4} Members
          </span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <ChatBox 
        tripId={tripId} 
        destination={destination}
        onActionExecute={handleActionExecute}
      />

    </div>
  );
};

export default AssistantPage;
