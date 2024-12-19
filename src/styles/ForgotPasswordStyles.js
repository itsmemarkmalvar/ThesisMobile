import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const forgotPasswordStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE5EC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 30,
  },
  backButton: {
    padding: 12,
    marginLeft: -12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#4A90E2',
    marginRight: 24,
  },
  content: {
    paddingHorizontal: 24,
  },
  description: {
    fontSize: 16,
    color: '#8F9BB3',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2E3A59',
    paddingLeft: 8,
  },
  inputError: {
    borderColor: '#FF4B4B',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  resetButton: {
    backgroundColor: '#4A90E2',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 