import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Navigation, 
  Plus, 
  Trash2, 
  Sparkles, 
  Shuffle, 
  CheckCircle2, 
  ArrowRight, 
  Compass, 
  Car, 
  Utensils, 
  Hotel,
  AlertCircle,
  Bell,
  AlertTriangle,
  DollarSign,
  Tag
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import TravelReminderModal from '../components/TravelReminderModal';

export const ItineraryPage = ({ trip, setActivePage, onSelectDirections }) => {
  const [activeDay, setActiveDay] = useState(1);
  const [itineraryItems, setItineraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderDetails, setReminderDetails] = useState({
    minutesBehind: 25,
    currentLocation: '',
    remainingCount: 3,
    nextLocation: ''
  });

  const [newActivity, setNewActivity] = useState({
    day_number: 1,
    time_slot: '10:00 AM',
    custom_title: '',
    activity_type: 'attraction',
    duration_hours: 2.0,
    estimated_cost: 250,
    notes: ''
  });

  const tripId = trip?.id || 1;
  const daysCount = trip?.days_count || 3;

  const fetchItinerary = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/itinerary/${tripId}`);
      if (res.success && res.data) {
        setItineraryItems(res.data);
      }
    } catch (err) {
      console.error('Error fetching itinerary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItinerary();
  }, [tripId]);

  const handleDeleteItem = async (itemId) => {
    try {
      const res = await api.delete(`/itinerary/${itemId}`);
      if (res.success) {
        setItineraryItems(prev => prev.filter(i => i.id !== itemId));
      }
    } catch (err) {
      alert(err.message || 'Failed to remove item');
    }
  };

  const handleOptimizeDay = async () => {
    try {
      setOptimizing(true);
      const res = await api.post(`/itinerary/${tripId}/optimize-day/${activeDay}`);
      if (res.success) {
        await fetchItinerary();
      }
    } catch (err) {
      alert(err.message || 'Failed to optimize route');
    } finally {
      setOptimizing(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newActivity.custom_title) return;

    try {
      const res = await api.post('/itinerary', {
        trip_id: tripId,
        ...newActivity,
        day_number: activeDay
      });
      if (res.success) {
        setShowAddModal(false);
        setNewActivity({
          day_number: activeDay,
          time_slot: '10:00 AM',
          custom_title: '',
          activity_type: 'attraction',
          duration_hours: 2.0,
          estimated_cost: 250,
          notes: ''
        });
        await fetchItinerary();
      }
    } catch (err) {
      alert(err.message || 'Failed to add activity');
    }
  };

  const handleDirectionsForStop = (item) => {
    const attractionName = item.custom_title || item.place?.name || '';
    const targetPayload = {
      destination: attractionName,
      name: attractionName,
      place: item.place || {
        name: attractionName,
        latitude: item.latitude || item.place?.latitude,
        longitude: item.longitude || item.place?.longitude,
        category: item.activity_type
      },
      latitude: item.latitude || item.place?.latitude,
      longitude: item.longitude || item.place?.longitude,
      origin: trip?.current_location || 'Chennai'
    };

    if (onSelectDirections) {
      onSelectDirections(targetPayload);
    } else {
      setActivePage('map');
    }
  };

  const currentDayItems = itineraryItems
    .filter(item => item.day_number === activeDay)
    .sort((a, b) => a.sort_order - b.sort_order);

  const totalPlannedHours = currentDayItems.reduce((acc, it) => acc + (it.duration_hours || 2.0), 0);
  const totalTransitMins = currentDayItems.reduce((acc, it) => acc + (it.travel_time_mins || 0), 0);
  const isScheduleTight = totalPlannedHours + (totalTransitMins / 60) > 8.0 || currentDayItems.length >= 4;

  const triggerScheduleReminder = () => {
    const curr = currentDayItems[0]?.custom_title || currentDayItems[0]?.place?.name || `${trip?.destination || 'Destination'} Stop 1`;
    const next = currentDayItems[1]?.custom_title || currentDayItems[1]?.place?.name || (currentDayItems.length > 0 ? `${trip?.destination} Stop 2` : 'Next Planned Location');
    const remaining = Math.max(1, currentDayItems.length - 1);

    setReminderDetails({
      minutesBehind: 25,
      currentLocation: curr,
      remainingCount: remaining,
      nextLocation: next
    });
    setShowReminder(true);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'restaurant': return <Utensils size={18} color="#FF6B6B" />;
      case 'hotel': return <Hotel size={18} color="#F4C95D" />;
      case 'transport': return <Car size={18} color="#0FA3B1" />;
      default: return <Compass size={18} color="#0FA3B1" />;
    }
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        background: 'var(--hero-gradient)',
        border: '1px solid var(--border)',
        padding: '28px 36px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-teal">
              <Calendar size={12} /> Timeline Schedule
            </span>
            <span className="badge badge-coral">
              {trip?.destination || 'Destination'} ({daysCount} Days)
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
            Day-by-Day Travel Itinerary
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={triggerScheduleReminder}
            style={{ color: '#B45309', borderColor: 'rgba(244, 201, 93, 0.4)' }}
            title="Check smart travel reminders"
          >
            <Bell size={15} /> Travel Reminder
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleOptimizeDay}
            disabled={optimizing || currentDayItems.length <= 1}
            title="Rearrange stops geographically using TSP nearest-neighbor algorithm to eliminate zigzag driving"
          >
            <Shuffle size={15} color="var(--primary)" /> 
            {optimizing ? 'Optimizing Route...' : `Smart Route Day ${activeDay}`}
          </button>

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} /> Add Stop
          </button>
        </div>
      </div>

      {/* Day Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '14px', overflowX: 'auto' }}>
        {Array.from({ length: daysCount }, (_, i) => i + 1).map((dayNum) => {
          const isActive = activeDay === dayNum;
          const dayStopsCount = itineraryItems.filter(it => it.day_number === dayNum).length;
          return (
            <button
              key={dayNum}
              onClick={() => setActiveDay(dayNum)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: isActive ? 'var(--cta-gradient)' : 'var(--bg-surface)',
                color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                boxShadow: isActive ? 'var(--shadow-glow)' : 'none'
              }}
            >
              <span>DAY {dayNum}</span>
              <span style={{
                fontSize: '0.74rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-card)',
                color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                fontWeight: 700
              }}>
                {dayStopsCount} stops
              </span>
            </button>
          );
        })}
      </div>

      {/* Schedule Balance Status Bar */}
      {currentDayItems.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          background: isScheduleTight ? 'rgba(245, 158, 11, 0.1)' : 'var(--success-bg)',
          border: `1px solid ${isScheduleTight ? 'rgba(245, 158, 11, 0.3)' : 'var(--success-border)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isScheduleTight ? (
              <AlertTriangle size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isScheduleTight ? '#B45309' : 'var(--success)' }}>
                {isScheduleTight 
                  ? 'High schedule density: Consider shortening stay at locations to allow buffer transit time.'
                  : `Day ${activeDay} schedule is balanced across sightseeing and travel window.`}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Planned Sightseeing: <strong>{totalPlannedHours.toFixed(1)} hrs</strong> • Transit Time: <strong>{totalTransitMins} mins</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={triggerScheduleReminder}
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            Check Schedule Status
          </button>
        </div>
      )}

      {/* Day Itinerary Timeline View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <LoadingSpinner text={`Loading Day ${activeDay} schedule...`} />
        </div>
      ) : currentDayItems.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <Calendar size={44} style={{ color: 'var(--text-dim)', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>No Activities Scheduled for Day {activeDay}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Add tourist places from Explore or create custom activities like hotel check-in, dining, or beach visits.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add First Stop
          </button>
        </div>
      ) : (
        <div className="timeline-track">
          {currentDayItems.map((item, index) => {
            const hasPrevTransit = index > 0 && (item.distance_from_prev_km > 0 || item.travel_time_mins > 0);
            return (
              <div key={item.id} className="timeline-item">
                <div className="timeline-node" />

                {/* Distance & Travel Time Transit Connector */}
                {hasPrevTransit && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary-light)',
                    border: '1px dashed var(--primary)',
                    color: 'var(--primary)',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    <Navigation size={12} />
                    <span>Transit: <strong>{item.distance_from_prev_km} km</strong> • ~{item.travel_time_mins} mins</span>
                  </div>
                )}

                {/* Activity Card */}
                <div className="glass-card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  gap: '18px',
                  borderLeft: `4px solid ${index === 0 ? 'var(--secondary-teal)' : (index === currentDayItems.length - 1 ? 'var(--accent-coral)' : 'var(--highlight-gold)')}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1 }}>
                    {/* Time Slot Pill */}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      textAlign: 'center',
                      minWidth: '100px'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800 }}>Stop #{index + 1}</div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 900, color: 'var(--primary)' }}>{item.time_slot}</div>
                    </div>

                    {/* Place Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        {getActivityIcon(item.activity_type)}
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          {item.custom_title || item.place?.name}
                        </h3>
                        {item.place?.category && (
                          <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>
                            {item.place.category}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', color: 'var(--text-muted)', fontSize: '0.84rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={14} /> {item.duration_hours || 2} hrs duration
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)', fontWeight: 600 }}>
                          <DollarSign size={14} color="var(--primary)" /> Est. ₹{item.estimated_cost || 200}
                        </span>
                        {item.notes && (
                          <span style={{ color: 'var(--text-dim)' }}>
                            • {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDirectionsForStop(item)}
                      title={`View directions to ${item.custom_title || item.place?.name} on map`}
                    >
                      <MapPin size={14} /> Map
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Remove activity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Stop Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(11, 19, 43, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '480px', maxWidth: '100%', padding: '30px' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-main)' }}>
              Add Activity to Day {activeDay}
            </h3>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Activity Title / Name</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Hotel Check-in, Botanical Garden, Beach Sunset"
                  value={newActivity.custom_title}
                  onChange={(e) => setNewActivity({ ...newActivity, custom_title: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Time Slot</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="10:30 AM"
                    value={newActivity.time_slot}
                    onChange={(e) => setNewActivity({ ...newActivity, time_slot: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Activity Type</label>
                  <select 
                    className="form-select"
                    value={newActivity.activity_type}
                    onChange={(e) => setNewActivity({ ...newActivity, activity_type: e.target.value })}
                  >
                    <option value="attraction">Tourist Attraction</option>
                    <option value="restaurant">Restaurant / Dining</option>
                    <option value="hotel">Hotel / Accommodation</option>
                    <option value="transport">Transit / Travel</option>
                    <option value="leisure">Leisure / Beach</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Duration (Hours)</label>
                  <input 
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    className="form-input"
                    value={newActivity.duration_hours}
                    onChange={(e) => setNewActivity({ ...newActivity, duration_hours: parseFloat(e.target.value) || 2 })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Cost (₹ INR)</label>
                  <input 
                    type="number"
                    step="50"
                    min="0"
                    className="form-input"
                    value={newActivity.estimated_cost}
                    onChange={(e) => setNewActivity({ ...newActivity, estimated_cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Carry cameras, warm jackets"
                  value={newActivity.notes}
                  onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Travel Reminder Floating Modal */}
      <TravelReminderModal
        isOpen={showReminder}
        onClose={() => setShowReminder(false)}
        onViewNextStop={() => {
          if (setActivePage) setActivePage('map');
        }}
        minutesBehind={reminderDetails.minutesBehind}
        currentLocation={reminderDetails.currentLocation}
        remainingCount={reminderDetails.remainingCount}
        nextLocation={reminderDetails.nextLocation}
      />
    </div>
  );
};

export default ItineraryPage;
