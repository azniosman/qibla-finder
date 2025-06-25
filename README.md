# Qibla Finder - Islamic Prayer App

A comprehensive React Native application designed to help Muslims maintain their daily prayers with accurate qibla direction, prayer time calculations, and prayer tracking features.

## Features

### 🧭 Qibla Direction Finder
- **Accurate Compass**: Uses device magnetometer and GPS for precise qibla direction
- **Visual Compass UI**: Elegant circular compass with Kaaba icon pointing toward Mecca
- **Location Detection**: Automatic GPS-based location detection with manual override
- **Calibration Guide**: Instructions for proper phone positioning and compass calibration
- **Offline Support**: Caches qibla calculations for previously used locations

### ⏰ Prayer Time Management
- **Automatic Prayer Times**: Calculate 5 daily prayers based on user location
- **Multiple Calculation Methods**: Support for different madhabs (Shafi, Hanafi) and organizations (ISNA, MWL, etc.)
- **Prayer Notifications**: Customizable adhan/notification sounds with snooze options
- **Hijri Calendar Integration**: Display Islamic dates alongside Gregorian calendar

### 📊 Prayer Tracking & Recording
- **Quick Prayer Logging**: One-tap buttons to mark prayers as completed
- **Prayer Status Indicators**: Visual indicators (✓ completed, ⏰ pending, ❌ missed)
- **Weekly/Monthly Views**: Calendar views showing prayer completion patterns
- **Streak Tracking**: Count consecutive days of complete prayers
- **Statistics Dashboard**: Charts showing prayer consistency over time

### 🔄 Missed Prayer (Qada) Management
- **Automatic Qada Counting**: Track missed prayers automatically
- **Qada Prayer Planner**: Set goals and schedules for making up missed prayers
- **Progress Tracking**: Visual progress bars for qada completion
- **Reminder System**: Gentle reminders for planned qada sessions
- **Bulk Logging**: Easy interface for logging multiple qada prayers

## Technical Architecture

### Platform & Framework
- **React Native** with Expo for iOS and Android
- **TypeScript** for type safety and better development experience
- **Offline-first architecture** with local storage

### Key Dependencies
```json
{
  "expo-location": "GPS and location services",
  "expo-sensors": "Magnetometer for compass",
  "expo-notifications": "Prayer time alerts",
  "@react-native-async-storage/async-storage": "Local data persistence",
  "react-native-vector-icons": "Islamic and UI icons",
  "react-native-charts-wrapper": "Statistics visualization",
  "moment-hijri": "Islamic calendar calculations",
  "expo-linear-gradient": "Beautiful UI gradients",
  "expo-haptics": "Haptic feedback"
}
```

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── QiblaCompass.tsx
│   └── PrayerTimeWidget.tsx
├── screens/            # Main app screens
│   └── HomeScreen.tsx
├── services/           # Business logic services
│   ├── locationService.ts
│   ├── compassService.ts
│   ├── storageService.ts
│   └── notificationService.ts
├── utils/              # Helper functions and constants
│   ├── constants.ts
│   └── prayerCalculations.ts
└── types/              # TypeScript type definitions
    └── index.ts
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for development)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qibla-finder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   
   # For web (limited functionality)
   npm run web
   ```

### Environment Setup

The app requires the following permissions and configurations:

#### iOS Permissions
- Location Services (Always and When In Use)
- Background App Refresh
- Notifications

#### Android Permissions
- ACCESS_FINE_LOCATION
- ACCESS_COARSE_LOCATION
- VIBRATE
- RECEIVE_BOOT_COMPLETED
- WAKE_LOCK

## Usage Guide

### Getting Started
1. **Location Setup**: Grant location permissions when prompted
2. **Compass Calibration**: Follow the on-screen instructions to calibrate the compass
3. **Prayer Times**: View automatically calculated prayer times for your location
4. **Prayer Tracking**: Tap to mark prayers as completed

### Qibla Direction
- Hold your phone flat and level
- The Kaaba icon will point toward the qibla direction
- Follow the calibration guide for best accuracy
- The app will vibrate when aligned with qibla

### Prayer Management
- View today's prayer times and status
- Tap "Complete" to mark prayers as done
- Long press for additional options
- Track your daily prayer completion

### Qada Management
- View missed prayers count
- Set daily qada targets
- Log qada prayers with date selection
- Track progress toward completion

## Prayer Calculation Methods

The app supports multiple calculation methods:

- **ISNA** (Islamic Society of North America)
- **MWL** (Muslim World League)
- **Egypt** (Egyptian General Authority of Survey)
- **Makkah** (Umm Al-Qura University, Makkah)
- **Karachi** (University of Islamic Sciences, Karachi)

## Data Privacy & Storage

- All data is stored locally on your device
- No personal information is transmitted to external servers
- Location data is used only for prayer time calculations
- Export/import functionality for data backup

## Performance Considerations

- **Compass Updates**: Throttled to 60fps for smooth performance
- **Location Caching**: Reduces GPS usage and battery consumption
- **Offline Support**: Works without internet connection
- **Background Processing**: Efficient prayer time calculations

## Testing

### Manual Testing Checklist
- [ ] Location permissions and GPS accuracy
- [ ] Compass calibration and qibla direction accuracy
- [ ] Prayer time calculations across different locations
- [ ] Notification scheduling and delivery
- [ ] Data persistence and offline functionality
- [ ] UI responsiveness and animations

### Automated Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive unit tests
- Maintain consistent code formatting
- Add proper error handling
- Document new features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the troubleshooting guide

## Acknowledgments

- Islamic prayer time calculation algorithms
- React Native and Expo communities
- Open source contributors and libraries
- Muslim community feedback and testing

## Roadmap

### Upcoming Features
- [ ] Multiple language support (Arabic, Urdu, Malay)
- [ ] Dark mode theme
- [ ] Widget support for home screen
- [ ] Apple Watch companion app
- [ ] Advanced statistics and analytics
- [ ] Community prayer time sharing
- [ ] Mosque finder integration
- [ ] Ramadan-specific features

### Performance Improvements
- [ ] Enhanced compass accuracy
- [ ] Optimized battery usage
- [ ] Faster app startup
- [ ] Improved offline functionality
- [ ] Better error handling and recovery 