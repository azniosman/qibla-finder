# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm start              # Start Expo development server
npm run android        # Run on Android device/emulator  
npm run ios           # Run on iOS device/simulator
npm run web           # Run on web browser

# Quality assurance
npm run validate      # Run all checks: TypeScript + ESLint + Tests
npm run type-check    # TypeScript compilation check
npm run lint          # ESLint code style check
npm run lint:fix      # Auto-fix ESLint issues
npm test              # Run Jest unit tests
npm run test:coverage # Run tests with coverage report

# Production builds
npm run build         # Export for production
npm run build:web     # Build for web platform
npm run build:android # Build Android APK/AAB via EAS
npm run build:ios     # Build iOS app via EAS
npm run prebuild      # Generate native projects
```

## Architecture Overview

This is a **production-ready Islamic prayer app** built with React Native/Expo featuring:

### Core Technology Stack
- **React Native 0.73** with **Expo 50** for cross-platform development
- **TypeScript 5.1** with strict mode for type safety  
- **React Navigation 7** for tab-based navigation
- **AsyncStorage** for local data persistence
- **Expo Sensors/Location/Notifications** for device integration

### App Structure (8 Screens)
1. **Home** - Dashboard with prayer countdown and quick access
2. **Prayer Times** - Prayer schedules and completion tracking 
3. **Qibla** - Real-time compass with magnetometer integration
4. **Qada** - Missed prayer management and makeup planning
5. **Calendar** - Islamic/Hijri calendar with important dates
6. **Dhikr** - Digital tasbih counter for remembrance
7. **Names** - 99 Names of Allah (Asma ul Husna)
8. **Settings** - App configuration and preferences

### Service Layer Architecture
All business logic is contained in dedicated services:

- **`locationService.ts`** - GPS location and prayer time calculations using 5 different Islamic calculation methods
- **`compassService.ts`** - Magnetometer integration, qibla direction calculation, device calibration
- **`storageService.ts`** - AsyncStorage wrapper for prayer records, settings, and app data
- **`notificationService.ts`** - Prayer time notifications, scheduling, and permission handling
- **`qadaService.ts`** - Missed prayer tracking and makeup planning system
- **`hijriCalendarService.ts`** - Islamic calendar calculations and important dates
- **`dhikrService.ts`** - Digital tasbih functionality and tracking
- **`asmaUlHusnaService.ts`** - 99 Names of Allah with Arabic text and meanings

### Key Data Models
Central types defined in `src/types/index.ts`:
- **`Prayer`** - Individual prayer with completion status and timing
- **`PrayerDay`** - Full day of 5 prayers with completion tracking
- **`QadaCount`** - Missed prayer counts by type
- **`AppSettings`** - User preferences and calculation methods
- **`Location`** - GPS coordinates with accuracy and timestamp
- **`QiblaDirection`** - Bearing and calibration status for compass

### Component Architecture
- **`PrayerTimeWidget.tsx`** - Displays prayer times with completion tracking
- **`QiblaCompass.tsx`** - Real-time compass with smooth 60fps animations
- **`ErrorBoundary.tsx`** - Global error handling for production stability
- **`LoadingSpinner.tsx`** - Consistent loading states

## Development Guidelines

### Code Quality Requirements
- **100% TypeScript compliance** - All code must pass `npm run type-check`
- **ESLint compliance** - Code must pass `npm run lint` 
- **Error handling** - Use ErrorBoundary and proper try/catch blocks
- **Performance** - Maintain 60fps animations, especially for compass

### Testing
- Unit tests are in `src/utils/__tests__/`
- Run `npm test` for all tests
- Jest configuration handles React Native/Expo mocking
- Focus tests on prayer calculation algorithms and business logic

### Platform-Specific Notes
- **iOS**: Requires location permissions and handles magnetometer gracefully
- **Android**: Full magnetometer support with haptic feedback  
- **Web**: Limited sensor support but full prayer time functionality

### Prayer Calculation Methods
The app supports 5 Islamic calculation standards defined in `PRAYER_CALCULATION_PARAMS`:
- **ISNA** (Islamic Society of North America)
- **MWL** (Muslim World League) 
- **Egypt** (Egyptian General Authority of Survey)
- **Makkah** (Umm Al-Qura University)
- **Karachi** (University of Islamic Sciences)

### Storage & Data Persistence
All data is stored locally using AsyncStorage with keys defined in `STORAGE_KEYS`:
- Prayer completion records by date
- User settings and preferences  
- Location cache for offline prayer times
- Qada counts and makeup plans
- Notification preferences

### Error Handling Strategy
- Global error boundary wraps entire app
- Service-level error handling with user-friendly messages
- Graceful degradation for missing device features (magnetometer, GPS)
- Production-ready error logging and recovery

## Common Development Tasks

### Adding New Prayer Features
1. Update types in `src/types/index.ts`
2. Implement business logic in appropriate service file
3. Add storage keys to `STORAGE_KEYS` constant
4. Update UI components with proper error handling
5. Add unit tests for calculation logic

### Modifying Prayer Calculations  
- Edit `src/utils/prayerCalculations.ts`
- Update `PRAYER_CALCULATION_PARAMS` for new methods
- Run existing tests: `npm test src/utils/__tests__/prayerCalculations.test.ts`

### Navigation Changes
- Modify `src/navigation/TabNavigator.tsx` 
- Update screen imports and tab configuration
- Ensure emoji icons and proper headers

### Adding Device Features
- Use appropriate Expo modules (expo-sensors, expo-location, etc.)
- Add proper permission handling
- Implement graceful fallbacks for missing features
- Test on both iOS and Android

ALWAYS run `npm run validate` before committing changes to ensure TypeScript, ESLint, and tests pass.