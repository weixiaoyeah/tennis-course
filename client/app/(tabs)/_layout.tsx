import { Tabs } from 'expo-router';
import { Platform, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  const [background, muted, accent, border] = useCSSVariable([
    '--color-background',
    '--color-muted',
    '--color-accent',
    '--color-border',
  ]) as string[];

  let tabBarStyle: ViewStyle = {
    backgroundColor: background,
    borderTopWidth: 1,
    borderTopColor: border,
  };

  if (Platform.OS === 'web') {
    tabBarStyle = {
      ...tabBarStyle,
    }
  }

  const labels = {
    home: '首页',
    teachers: '教练',
    courses: '课程',
    records: '记录',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: labels.home,
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teachers"
        options={{
          title: labels.teachers,
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user-tie" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: labels.courses,
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="book" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: labels.records,
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="clipboard-list" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
