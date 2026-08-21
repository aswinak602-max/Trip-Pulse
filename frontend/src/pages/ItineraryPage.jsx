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
  AlertTriangle
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

  // Calculate schedule stats for the active day
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
      case 'restaurant': return <Utensils size={16} color="#f97316" />;
      case 'hotel': return <Hotel size={16} color="#8b5cf6" />;
      case 'transport': return <Car size={16} color="#3b82f6" />;
      default: return <Compass size={16} color="#10b981" />;
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(17, 24, 39, 0.8) 100%)',
        padding: '24px 32px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-info">
              <Calendar size={12} /> Day-Wise Trip Schedule
            </span>
            <span className="badge badge-success">
              {trip?.destination || 'Destination'} ({daysCount} Days)
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Interactive Itinerary & Route Flow
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={triggerScheduleReminder}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}
            title="Check smart travel reminders and schedule status"
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
            {optimizing ? 'Optimizing Route...' : `Smart Optimize Day ${activeDay}`}
          </button>

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} /> Add Stop to Day {activeDay}
          </button>
        </div>
      </div>

      {/* Day Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
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
                padding: '10px 20px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: isActive ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              <span>Day {dayNum}</span>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                color: isActive ? '#fff' : 'var(--text-dim)'
              }}>
                {dayStopsCount} stops
              </span>
            </button>
          );
        })}
      </div>

      {/* Smart Equal Time Distribution Schedule Status Bar */}
      {currentDayItems.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          background: isScheduleTight ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.08)',
          border: `1px solid ${isScheduleTight ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isScheduleTight ? (
              <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isScheduleTight ? '#fef3c7' : '#d1fae5' }}>
                {isScheduleTight 
                  ? 'Your current schedule is tight. You may need to reduce the time spent at some locations or remove one attraction.'
                  : `Optimal Equal Time Distribution: ${currentDayItems.length} stops balanced across Day ${activeDay}.`}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Total Sightseeing: <strong style={{ color: '#fff' }}>{totalPlannedHours.toFixed(1)} hrs</strong> • Transit Time: <strong style={{ color: '#fff' }}>{totalTransitMins} mins</strong> • Available Window: <strong>9.0 hrs</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={triggerScheduleReminder}
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            Check Schedule Reminder
          </button>
        </div>
      )}

      {/* Day Itinerary Timeline */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <LoadingSpinner text={`Loading Day ${activeDay} schedule...`} />
        </div>
      ) : currentDayItems.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <Calendar size={40} style={{ color: 'var(--text-dim)', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>No Activities Scheduled for Day {activeDay}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '18px' }}>
            Add tourist places from Explore tab or create custom restaurant/hotel stops.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add First Activity
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentDayItems.map((item, index) => {
            const hasPrevTransit = index > 0 && (item.distance_from_prev_km > 0 || item.travel_time_mins > 0);
            return (
              <React.Fragment key={item.id}>
                {/* Distance & Travel Time Transit Connector */}
                {hasPrevTransit && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginLeft: '28px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px dashed rgba(59, 130, 246, 0.3)',
                    color: '#93c5fd',
                    fontSize: '0.8rem',
                    width: 'fit-content'
                  }}>
                    <Navigation size={13} />
                    <span>Transit: <strong>{item.distance_from_prev_km} km</strong> ({item.travel_time_mins} mins driving)</span>
                  </div>
                )}

                {/* Activity Card */}
                <div className="glass-card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 24px',
                  gap: '16px',
                  borderLeft: `4px solid ${index === 0 ? '#10b981' : (index === currentDayItems.length - 1 ? '#8b5cf6' : '#3b82f6')}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    {/* Time Slot Pill */}
                    <div style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border)',
                      textAlign: 'center',
                      minWidth: '95px'
                    }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Stop #{index + 1}</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>{item.time_slot}</div>
                    </div>

                    {/* Place Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {getActivityIcon(item.activity_type)}
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                          {item.custom_title || item.place?.name}
                        </h3>
                        {item.place?.category && (
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            {item.place.category}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> {item.duration_hours || 2} hours duration
                        </span>
                        {item.notes && (
                          <span style={{ color: '#cbd5e1' }}>
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
                      <MapPin size={14} /> Directions
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
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Add Stop Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '480px', maxWidth: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '18px' }}>
              Add Activity to Day {activeDay}
            </h3>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Activity Title / Name</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Doddabetta Peak Sightseeing"
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
                    <option value="leisure">Leisure / Free Time</option>
                  </select>
                </div>
              </div>

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
                <label className="form-label">Notes (Optional)</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Carry camera and jackets"
                  value={newActivity.notes}
                  onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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
