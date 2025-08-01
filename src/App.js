import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Container, TextField, Paper, MenuItem } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { GoogleMap, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { supabase } from './supabaseClient'; // Add this at the top

const ZetsLogo = process.env.PUBLIC_URL + '/zets_logo.png';
// Thank you / waitlist animation
const ThankYouScreen = ({ onContinue }) => (
  <motion.div
    key="thankyou"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.7 }}
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'black',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      zIndex: 9999,
    }}
  >
    <motion.div
      initial={{ scale: 0.7, rotate: 0 }}
      animate={{ scale: 1.1, rotate: 10 }}
      transition={{ duration: 0.7, yoyo: Infinity }}
    >
      <motion.img
        src={ZetsLogo}
        alt="ZETS Logo"
        width={180}
        height={180}
        initial={{ scale: 0, rotate: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], rotate: [0, 360], opacity: [0, 1] }}
        transition={{ duration: 2, ease: 'easeInOut' }}
        style={{ margin: '0 auto', display: 'block' }}
      />
    </motion.div>
    <Typography variant="h4" sx={{ color: '#00fff7', mt: 4, mb: 2, textShadow: '0 0 10px #00fff7' }}>
      🎉 Congratulations!
    </Typography>
    <Typography variant="h5" sx={{ color: '#fff', mb: 2, textAlign: 'center' }}>
      You've joined the exclusive
    </Typography>
    <Typography variant="h4" sx={{ color: '#00fff7', mb: 3, textShadow: '0 0 15px #00fff7', fontWeight: 'bold' }}>
      First 100 Member Club
    </Typography>
    <Typography variant="h6" sx={{ color: '#fff', mb: 4, textAlign: 'center', maxWidth: 500 }}>
      Get ready for special offers, early access, and exclusive surprises when ZETS launches!
    </Typography>
    <Button
      variant="contained"
      size="large"
      sx={{ bgcolor: '#00fff7', color: 'black', fontWeight: 700, borderRadius: '30px', px: 5, py: 1.5, boxShadow: '0 0 20px #00fff7', '&:hover': { bgcolor: '#00bfae' } }}
      onClick={onContinue}
    >
      Fill Out Quick Survey
    </Button>
  </motion.div>
);

// Multi-step animated survey form
const surveySteps = [
  {
    label: 'Your Name',
    field: 'name',
    required: true,
    type: 'text',
    placeholder: 'Enter your name',
  },
  {
    label: 'Email Address',
    field: 'email',
    required: true,
    type: 'email',
    placeholder: 'Enter your email',
  },
  {
    label: 'Phone (optional)',
    field: 'phone',
    required: false,
    type: 'tel',
    placeholder: 'Enter your phone number',
    maxLength: 10,
    inputProps: { maxLength: 10, pattern: '[0-9]*' },
  },
  {
    label: 'City',
    field: 'city',
    required: true,
    type: 'text',
    placeholder: 'Which city do you live in?',
  },
  {
    label: 'How do you currently commute?',
    field: 'commute',
    required: true,
    type: 'text',
    placeholder: 'e.g. Ola, Uber, Auto, Bus, etc.',
  },
  {
    label: 'What features do you want in a ride-hailing app?',
    field: 'features',
    required: false,
    type: 'text',
    placeholder: 'Your wishlist (optional)',
  },
  {
    label: 'Would you use ZETS when it launches?',
    field: 'intent',
    required: true,
    type: 'select',
    options: ['Definitely!', 'Maybe', 'Not sure', 'No'],
  },
  {
    label: 'Any other feedback?',
    field: 'feedback',
    required: false,
    type: 'text',
    placeholder: 'Share your thoughts (optional)',
  },
];

const SurveyForm = ({ onSubmit }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const current = surveySteps[step];
  const total = surveySteps.length;

  // Update handleChange to support both TextField and Select events
  const handleChange = (e) => {
    let value = e.target.value !== undefined ? e.target.value : e.target.textContent;
    if (current.field === 'phone') {
      value = value.replace(/[^0-9]/g, '');
    }
    setForm({ ...form, [current.field]: value });
    setError('');
  };

  const handleNext = () => {
    if (current.required && !form[current.field]) {
      setError('This field is required');
      return;
    }
    
    // Email validation
    if (current.field === 'email' && form[current.field]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form[current.field])) {
        setError('Please enter a valid email address');
        return;
      }
    }
    // Phone validation (if filled)
    if (current.field === 'phone' && form[current.field]) {
      const phone = form[current.field];
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }
    }
    
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => s - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (current.required && !form[current.field]) {
      setError('This field is required');
      return;
    }
  
    setSubmitting(true);
  
    const { error } = await supabase
      .from('survey_responses') // your Supabase table name
      .insert([form]); // insert the entire form object
  
    if (error) {
      console.error('Supabase Error:', error.message);
      setError('Submission failed. Please try again later.');
      setSubmitting(false);
      return;
    }
  
    setSubmitting(false);
    setSubmitted(true);
    onSubmit && onSubmit(form);
  };
  if (submitted) {
    return (
      <motion.div
        key="survey-confirm"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.7 }}
        style={{ textAlign: 'center', color: '#00fff7', padding: 32 }}
      >
        <motion.img
          src={ZetsLogo}
          alt="ZETS Logo"
          width={180}
          height={180}
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], rotate: [0, 360], opacity: [0, 1] }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          style={{ margin: '0 auto', display: 'block' }}
        />
        <Typography variant="h4" sx={{ mt: 3, mb: 2 }}>
          Thank you for your feedback!
        </Typography>
        <Typography variant="body1" sx={{ color: '#fff', mb: 3 }}>
          You're helping shape the future of ZETS.
        </Typography>
        <Typography variant="h6" sx={{ color: '#00fff7', mb: 2, fontWeight: 'bold' }}>
          Follow us on social media to stay tuned!
        </Typography>
        <Typography variant="body2" sx={{ color: '#aaa', mb: 4 }}>
          Get exclusive updates, behind-the-scenes content, and be the first to know when ZETS launches!
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            sx={{ 
              color: '#00fff7', 
              borderColor: '#00fff7', 
              borderRadius: '30px', 
              px: 3, 
              py: 1.2,
              '&:hover': { 
                bgcolor: '#00fff7', 
                color: 'black',
                borderColor: '#00fff7'
              }
            }}
            onClick={() => window.open('https://instagram.com/zets.in', '_blank')}
          >
            📱 Instagram
          </Button>
          <Button
            variant="outlined"
            sx={{ 
              color: '#00fff7', 
              borderColor: '#00fff7', 
              borderRadius: '30px', 
              px: 3, 
              py: 1.2,
              '&:hover': { 
                bgcolor: '#00fff7', 
                color: 'black',
                borderColor: '#00fff7'
              }
            }}
            onClick={() => window.open('https://x.com/Zets.in', '_blank')}
          >
            𝕏 
          </Button>
          <Button
            variant="outlined"
            sx={{ 
              color: '#00fff7', 
              borderColor: '#00fff7', 
              borderRadius: '30px', 
              px: 3, 
              py: 1.2,
              '&:hover': { 
                bgcolor: '#00fff7', 
                color: 'black',
                borderColor: '#00fff7'
              }
            }}
            onClick={() => window.open('https://facebook.com/zets', '_blank')}
          >
            📘 Facebook
          </Button>
        </Box>
        <Button
          variant="contained"
          sx={{ bgcolor: '#00fff7', color: 'black', borderRadius: '30px', fontWeight: 700, px: 4, py: 1.2, boxShadow: '0 0 20px #00fff7', '&:hover': { bgcolor: '#00bfae' } }}
          onClick={() => window.location.href = 'https://zets.in'}
        >
          Back to Home
        </Button>
      </motion.div>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        bgcolor: 'rgba(0,0,0,0.85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.7 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <Paper elevation={8} sx={{ bgcolor: '#181818', p: 4, borderRadius: 4, minWidth: 280, maxWidth: 400, mx: 'auto', position: 'relative', zIndex: 1301, overflow: 'visible' }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ width: '100%', mb: 1 }}>
              <Box sx={{ height: 8, bgcolor: '#222', borderRadius: 4, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: 8, background: 'linear-gradient(90deg, #00fff7, #00bfae)', borderRadius: 4 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${((step + 1) / total) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#00fff7' }}>
                Step {step + 1} of {total}
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: '#00fff7', mb: 1 }}>
              {current.label}
            </Typography>
            {current.type === 'select' ? (
              <TextField
                select
                fullWidth
                variant="filled"
                color="primary"
                value={form[current.field] || ''}
                onChange={handleChange}
                sx={{ mb: 2 }}
                InputLabelProps={{ style: { color: '#00fff7' } }}
                SelectProps={{ MenuProps: { disablePortal: true } }}
              >
                <MenuItem value="" disabled>
                  <span style={{ color: '#888' }}>Select an option</span>
                </MenuItem>
                {current.options.map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                type={current.type}
                label={current.placeholder}
                variant="filled"
                fullWidth
                value={form[current.field] || ''}
                onChange={handleChange}
                sx={{ mb: 2, input: { color: 'white' }, label: { color: '#00fff7' } }}
                InputLabelProps={{ style: { color: '#00fff7' } }}
                inputProps={current.inputProps || {}}
                autoFocus
              />
            )}
            {error && <Typography sx={{ color: 'red', mb: 1 }}>{error}</Typography>}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              sx={{ color: '#00fff7', borderColor: '#00fff7', borderRadius: '30px', px: 3, fontWeight: 700, visibility: step === 0 ? 'hidden' : 'visible' }}
              onClick={handleBack}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < total - 1 ? (
              <Button
                variant="contained"
                sx={{ bgcolor: '#00fff7', color: 'black', borderRadius: '30px', fontWeight: 700, px: 4, py: 1.2, boxShadow: '0 0 20px #00fff7', '&:hover': { bgcolor: '#00bfae' } }}
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                sx={{ bgcolor: '#00fff7', color: 'black', borderRadius: '30px', fontWeight: 700, px: 4, py: 1.2, boxShadow: '0 0 20px #00fff7', '&:hover': { bgcolor: '#00bfae' } }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupAutocomplete, setPickupAutocomplete] = useState(null);
  const [dropoffAutocomplete, setDropoffAutocomplete] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [directions, setDirections] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Default: New Delhi

  // Debug: Check if API key is loaded
  console.log('Google Maps API Key:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  // Debug: Check if Google Maps is loaded
  console.log('Google Maps Loaded:', isLoaded);

  const onPickupPlaceChanged = () => {
    if (pickupAutocomplete) {
      setPickup(pickupAutocomplete.getPlace().formatted_address || '');
    }
  };
  const onDropoffPlaceChanged = () => {
    if (dropoffAutocomplete) {
      setDropoff(dropoffAutocomplete.getPlace().formatted_address || '');
    }
  };

  // Geocode address to lat/lng
  const geocodeAddress = (address, setter) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setter({
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        });
      }
    });
  };

  useEffect(() => {
    if (pickup) geocodeAddress(pickup, setPickupCoords);
  }, [pickup]);
  useEffect(() => {
    if (dropoff) geocodeAddress(dropoff, setDropoffCoords);
  }, [dropoff]);
  useEffect(() => {
    // Center map on pickup or dropoff
    if (pickupCoords) setMapCenter(pickupCoords);
    else if (dropoffCoords) setMapCenter(dropoffCoords);
  }, [pickupCoords, dropoffCoords]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleBookRide = () => {
    setShowThankYou(true);
    setTimeout(() => {
      setShowThankYou(false);
      setShowSurvey(true);
    }, 4000); // Show thank you for 4 seconds, then survey
  };

  const handleContinueToSurvey = () => {
    setShowThankYou(false);
    setShowSurvey(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'black', color: 'white', fontFamily: 'Montserrat, sans-serif' }}>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'black',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.img
              src={ZetsLogo}
              alt="ZETS Logo"
              width={180}
              height={180}
              initial={{ scale: 0, rotate: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], rotate: [0, 360], opacity: [0, 1] }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              style={{ margin: '0 auto', display: 'block' }}
            />
            <Typography variant="h5" sx={{ mt: 3, color: '#00fff7', letterSpacing: 2, textShadow: '0 0 10px #00fff7' }}>
              ZETS is coming soon...
            </Typography>
          </motion.div>
        )}
        {showThankYou && <ThankYouScreen onContinue={handleContinueToSurvey} />}
        {showSurvey && <SurveyForm />}
      </AnimatePresence>
      {!showSplash && !showThankYou && !showSurvey && (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Container maxWidth="sm" sx={{ textAlign: 'center', py: 8 }}>
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              {/* Replace ZetsLogo with your real logo later */}
              <motion.img
                src={ZetsLogo}
                alt="ZETS Logo"
                width={180}
                height={180}
                initial={{ scale: 0, rotate: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], rotate: [0, 360], opacity: [0, 1] }}
                transition={{ duration: 2, ease: 'easeInOut' }}
                style={{ margin: '0 auto', display: 'block' }}
              />
              <Typography variant="h5" sx={{ mb: 4, color: '#fff', textShadow: '0 0 10px #00fff7', mt: 2 }}>
                The Future of Ride-Hailing is Coming Soon
              </Typography>
            </motion.div>
            {/* Google Map above the form */}
            {isLoaded && (
              <Box sx={{ width: '100%', height: 320, mb: 3, borderRadius: 4, overflow: 'hidden', boxShadow: '0 0 20px #00fff755' }}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={mapCenter}
                  zoom={pickupCoords || dropoffCoords ? 13 : 11}
                  options={{ disableDefaultUI: true, styles: [
                    { elementType: 'geometry', stylers: [{ color: '#181818' }] },
                    { elementType: 'labels.text.stroke', stylers: [{ color: '#181818' }] },
                    { elementType: 'labels.text.fill', stylers: [{ color: '#00fff7' }] },
                    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#222' }] },
                    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#222' }] },
                  ] }}
                >
                  {pickupCoords && <Marker position={pickupCoords} label="A" />}
                  {dropoffCoords && <Marker position={dropoffCoords} label="B" />}
                  {pickupCoords && dropoffCoords && (
                    <DirectionsService
                      options={{
                        destination: dropoffCoords,
                        origin: pickupCoords,
                        travelMode: 'DRIVING',
                      }}
                      callback={res => {
                        if (res && res.status === 'OK') setDirections(res);
                      }}
                    />
                  )}
                  {directions && (
                    <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />
                  )}
                </GoogleMap>
              </Box>
            )}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <Paper elevation={6} sx={{ bgcolor: '#181818', p: 3, borderRadius: 4, mt: 4, mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00fff7', mb: 2 }}>
                  Simulate Your First ZETS Ride
                </Typography>
                {isLoaded ? (
                  <>
                    <Autocomplete onLoad={setPickupAutocomplete} onPlaceChanged={onPickupPlaceChanged}>
                      <TextField
                        label="Pickup Location"
                        variant="filled"
                        fullWidth
                        value={pickup}
                        onChange={e => setPickup(e.target.value)}
                        sx={{ mb: 2, input: { color: 'white' }, label: { color: '#00fff7' } }}
                        InputLabelProps={{ style: { color: '#00fff7' } }}
                        placeholder="Enter pickup address"
                      />
                    </Autocomplete>
                    <Autocomplete onLoad={setDropoffAutocomplete} onPlaceChanged={onDropoffPlaceChanged}>
                      <TextField
                        label="Drop-off Location"
                        variant="filled"
                        fullWidth
                        value={dropoff}
                        onChange={e => setDropoff(e.target.value)}
                        sx={{ mb: 2, input: { color: 'white' }, label: { color: '#00fff7' } }}
                        InputLabelProps={{ style: { color: '#00fff7' } }}
                        placeholder="Enter drop-off address"
                      />
                    </Autocomplete>
                  </>
                ) : (
                  <TextField
                    label="Loading Google Maps..."
                    variant="filled"
                    fullWidth
                    disabled
                    sx={{ mb: 2, input: { color: 'white' }, label: { color: '#00fff7' } }}
                  />
                )}
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: '#00fff7',
                    color: 'black',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    px: 4,
                    py: 1.5,
                    borderRadius: '30px',
                    boxShadow: '0 0 20px #00fff7',
                    '&:hover': { bgcolor: '#00bfae', boxShadow: '0 0 30px #00fff7' },
                    transition: 'all 0.3s',
                  }}
                  onClick={handleBookRide}
                  disabled={!pickup || !dropoff}
                >
                  Book Ride
                </Button>
              </Paper>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
            >
              <Typography variant="body2" sx={{ mt: 6, color: '#aaa' }}>
                Join the waitlist and be the first to ride ZETS. <br />
                <span style={{ color: '#00fff7' }}>Launching soon in your city!</span>
              </Typography>
            </motion.div>
          </Container>
        </Box>
      )}
    </Box>
  );
}

export default App;
