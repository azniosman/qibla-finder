import { Alert } from 'react-native';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle different types of errors with appropriate user messages
   */
  handleError(error: unknown, context?: string): void {
    console.error(`Error in ${context || 'unknown context'}:`, error);

    const appError = this.parseError(error);
    this.logError(appError, context);
    this.showUserFriendlyMessage(appError);
  }

  /**
   * Parse unknown error into structured AppError
   */
  private parseError(error: unknown): AppError {
    const timestamp = Date.now();

    if (error instanceof Error) {
      return {
        code: error.name || 'UnknownError',
        message: error.message,
        details: error.stack,
        timestamp,
      };
    }

    if (typeof error === 'string') {
      return {
        code: 'StringError',
        message: error,
        timestamp,
      };
    }

    return {
      code: 'UnknownError',
      message: 'An unknown error occurred',
      details: error,
      timestamp,
    };
  }

  /**
   * Log error for debugging and analytics
   */
  private logError(error: AppError, context?: string): void {
    const logEntry = {
      ...error,
      context,
      userAgent: 'React Native App',
      // In production, you might include device info, app version, etc.
    };

    console.error('Error logged:', logEntry);
    
    // In production, send to error tracking service
    // Example: Sentry.captureException(error);
  }

  /**
   * Show user-friendly error message
   */
  private showUserFriendlyMessage(error: AppError): void {
    const userMessage = this.getUserFriendlyMessage(error);
    
    Alert.alert(
      'Error',
      userMessage,
      [
        { text: 'OK' },
        {
          text: 'Report',
          onPress: () => this.reportError(error),
        },
      ]
    );
  }

  /**
   * Convert technical error to user-friendly message
   */
  private getUserFriendlyMessage(error: AppError): string {
    switch (error.code) {
      case 'LocationPermissionDenied':
        return 'Location permission is required to calculate prayer times and find Qibla direction. Please enable location access in your device settings.';
      
      case 'LocationNotAvailable':
        return 'Unable to get your location. Please check your GPS settings and try again.';
      
      case 'NetworkError':
        return 'Network connection problem. Please check your internet connection and try again.';
      
      case 'StorageError':
        return 'Failed to save data. Please check your device storage and try again.';
      
      case 'NotificationPermissionDenied':
        return 'Notification permission is required for prayer time reminders. You can enable it in the app settings.';
      
      case 'CompassNotAvailable':
        return 'Compass sensor is not available on this device. Qibla direction may not be accurate.';
      
      case 'CalibrationRequired':
        return 'Compass needs calibration. Please move your device in a figure-8 pattern.';
      
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Report error to support or analytics
   */
  private reportError(error: AppError): void {
    // In production, you might:
    // - Send to crash reporting service
    // - Open email client with error details
    // - Show in-app feedback form
    
    console.log('Error reported:', error);
    Alert.alert(
      'Thank You',
      'Error report has been recorded. Our team will investigate the issue.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Create specific error types for common scenarios
   */
  static createLocationError(message: string): Error {
    const error = new Error(message);
    error.name = 'LocationNotAvailable';
    return error;
  }

  static createPermissionError(permission: string): Error {
    const error = new Error(`${permission} permission denied`);
    error.name = `${permission}PermissionDenied`;
    return error;
  }

  static createStorageError(operation: string): Error {
    const error = new Error(`Storage ${operation} failed`);
    error.name = 'StorageError';
    return error;
  }

  static createNetworkError(message: string): Error {
    const error = new Error(message);
    error.name = 'NetworkError';
    return error;
  }
}

/**
 * Global error handler for unhandled promise rejections
 */
export const setupGlobalErrorHandling = (): void => {
  const errorHandler = ErrorHandler.getInstance();

  // Handle unhandled promise rejections in React Native
  try {
    const globalObj = globalThis as any;
    const originalHandler = globalObj.ErrorUtils?.getGlobalHandler?.();
    
    globalObj.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
      errorHandler.handleError(error, 'globalError');
      originalHandler?.(error, isFatal);
    });
  } catch (error) {
    console.warn('Failed to setup global error handling:', error);
  }
};