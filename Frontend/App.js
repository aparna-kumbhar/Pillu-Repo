import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './Screens/Login/Login';

// Enforce full-height container on Web to fix global ScrollView issues
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100vh;
      min-height: 100vh;
      max-height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    #root > div {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `;
  document.head.appendChild(style);
}

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Login"
      >
        <Stack.Screen name="Login" component={Login} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
