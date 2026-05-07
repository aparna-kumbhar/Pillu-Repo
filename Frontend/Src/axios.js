import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const KNOWN_LAN_FALLBACKS = ['http://localhost:5001'];

const resolveWebBaseUrl = () => {
	if (typeof window !== 'undefined' && window.location?.hostname) {
		return `http://${window.location.hostname}:5001`;
	}
	return 'http://localhost:5001';
};

const resolveDevHost = () => {
	const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
	if (!scriptURL) return '';

	try {
		return new URL(scriptURL).hostname || '';
	} catch (error) {
		const match = scriptURL.match(/https?:\/\/([^/:]+)/i);
		return match?.[1] || '';
	}
};

const resolveExpoHost = () => {
	const hostUri =
		Constants?.expoConfig?.hostUri ||
		Constants?.manifest2?.extra?.expoClient?.hostUri ||
		Constants?.manifest?.debuggerHost ||
		'';

	if (!hostUri) return '';
	return String(hostUri).split(':')[0] || '';
};

export const getApiBaseUrls = () => {
	const urls = [];
	const add = (url) => {
		if (url && !urls.includes(url)) {
			urls.push(url);
		}
	};

	// For Expo Go on physical device, use your machine's IP address
	add('http://10.83.123.173:5001');
	add('http://localhost:5001');
	add('http://127.0.0.1:5001');
	add('http://10.0.2.2:5001');
	
	return urls;
};

export const API_BASE_URLS = getApiBaseUrls();

export const API_BASE_URL = API_BASE_URLS[0] || 'http://localhost:5001';

export const fetchWithDirectBaseUrl = async (path, options = {}) => {
	const response = await fetch(`${API_BASE_URL}${path}`, options);
	return { response, baseUrl: API_BASE_URL };
};

export const fetchWithBaseUrlFallback = async (path, options = {}) => {
	let lastError = null;

	for (const baseUrl of API_BASE_URLS) {
		try {
			console.log(`🔄 Trying ${baseUrl}${path}...`);
			const response = await fetch(`${baseUrl}${path}`, options);
			console.log(`✅ Got response from ${baseUrl}${path}: ${response.status}`);
			if (response.ok) {
				console.log(`✅ Success! Returning response from ${baseUrl}${path}`);
				return { response, baseUrl };
			}
			lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
			console.log(`❌ Response not ok: ${lastError.message}`);
		} catch (error) {
			console.log(`❌ Failed to reach ${baseUrl}${path}: ${error.message}`);
			lastError = error;
		}
	}

	console.error('❌ All URLs failed');
	throw lastError || new Error('Unable to reach the backend');
};

