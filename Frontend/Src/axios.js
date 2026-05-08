import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KNOWN_LAN_FALLBACKS = ['http://10.83.123.173:5001'];

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

	if (Platform.OS === 'web') {
		add(resolveWebBaseUrl());
	} else {
		const devHost = resolveDevHost();
		const expoHost = resolveExpoHost();

		add(devHost ? `http://${devHost}:5001` : '');
		add(expoHost ? `http://${expoHost}:5001` : '');
	}

	KNOWN_LAN_FALLBACKS.forEach(add);
	add('http://localhost:5001');
	add('http://127.0.0.1:5001');

	return urls;
};

export const API_BASE_URLS = getApiBaseUrls();

export const API_BASE_URL = API_BASE_URLS[0] || 'http://localhost:5001';

/** Retrieve the stored JWT token from AsyncStorage */
const getAuthToken = async () => {
	try {
		return await AsyncStorage.getItem('auth_jwt_token');
	} catch {
		return null;
	}
};

/** Inject Authorization header into options if token exists */
const withAuthHeaders = async (options = {}) => {
	const token = await getAuthToken();
	if (!token) return options;
	return {
		...options,
		headers: {
			...(options.headers || {}),
			Authorization: `Bearer ${token}`,
		},
	};
};

export const fetchWithDirectBaseUrl = async (path, options = {}) => {
	const authedOptions = await withAuthHeaders(options);
	const response = await fetch(`${API_BASE_URL}${path}`, authedOptions);
	return { response, baseUrl: API_BASE_URL };
};

export const fetchWithBaseUrlFallback = async (path, options = {}) => {
	const authedOptions = await withAuthHeaders(options);
	let lastError = null;

	for (const baseUrl of API_BASE_URLS) {
		try {
			console.log(`🔄 Trying ${baseUrl}${path}...`);
			const response = await fetch(`${baseUrl}${path}`, authedOptions);
			console.log(`✅ Got response from ${baseUrl}${path}: ${response.status}`);

			return { response, baseUrl };
		} catch (error) {
			console.log(`❌ Failed to reach ${baseUrl}${path}: ${error.message}`);
			lastError = error;
		}
	}

	console.error('❌ All URLs failed');
	throw lastError || new Error('Unable to reach the backend');
};
