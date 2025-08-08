import { logError } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export function useLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  // Load manual location from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedLocation = await AsyncStorage.getItem('@manual_location');
        if (storedLocation) {
          const parsedLocation = JSON.parse(storedLocation);
          if (parsedLocation.lat && parsedLocation.lng) {
            setManualLocation(parsedLocation);
          }
        }
      } catch (error) {
        // Ignore storage errors
      }
    })();
  }, []);

  // Only requests permission, does not fetch location
  const requestPermission = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied. Please enable location access in settings or enter your location manually.');
        setPermissionGranted(false);
        setPermissionDenied(true);
        setLoading(false);
        return false;
      }
      setErrorMsg(null);
      setPermissionGranted(true);
      setPermissionDenied(false);
      setLoading(false);
      return true;
    } catch (error: any) {
      logError(error, 'useLocation: requestPermission');
      setErrorMsg(`Could not request location permission: ${error.message || 'Unknown error'}`);
      setPermissionGranted(false);
      setPermissionDenied(true);
      setLoading(false);
      return false;
    }
  }, []);

  // Fetches the current location (assumes permission granted)
  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const newLocation = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocation(newLocation);
      setErrorMsg(null);
      setPermissionGranted(true);
      setPermissionDenied(false);
      // Debug log for verification (remove in production)
      console.log('Location obtained:', newLocation);
      console.log('Accuracy:', loc.coords.accuracy, 'meters');
    } catch (error: any) {
      logError(error, 'useLocation: getCurrentLocation');
      console.error('Location error:', error);
      if (error.code === 'E_LOCATION_TIMEOUT') {
        setErrorMsg('Location request timed out. Please try again.');
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        setErrorMsg('Location services unavailable. Please enable GPS.');
      } else if (error.code === 'E_LOCATION_SETTINGS_UNSATISFIED') {
        setErrorMsg('Location settings need to be adjusted. Please enable high accuracy mode.');
      } else {
        setErrorMsg(`Could not get location: ${error.message || 'Unknown error'}`);
      }
      setPermissionGranted(false);
      setPermissionDenied(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual refresh
  const refreshLocation = () => {
    getCurrentLocation();
  };

  // Enhanced setManualLocation that also stores to AsyncStorage
  const setManualLocationWithStorage = useCallback(async (newLocation: { lat: number; lng: number }) => {
    setManualLocation(newLocation);
    try {
      await AsyncStorage.setItem('@manual_location', JSON.stringify(newLocation));
    } catch (error) {
      // Ignore storage errors
    }
  }, []);

  // Use manual location if provided and permission is denied
  const effectiveLocation = permissionDenied && manualLocation ? manualLocation : location;

  return {
    location: effectiveLocation,
    errorMsg,
    loading,
    refreshLocation,
    requestPermission,
    getCurrentLocation,
    permissionGranted,
    permissionDenied,
    setManualLocation: setManualLocationWithStorage,
  };
}
