import { StyleSheet, Platform, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.15,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: height * 0.08,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicalIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#8F9BB3',
    marginBottom: 40,
  },
  buttonSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  facebookButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  phoneButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 14,
    color: '#2E3A59',
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#4A90E2',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
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
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#8F9BB3',
    marginTop: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 32,
  },
  signupText: {
    fontSize: 13,
    color: '#8F9BB3',
  },
  signupLink: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '500',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFE5EC',
  },
  formSection: {
    width: '100%',
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16,
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
  passwordToggle: {
    padding: 8,
  },
  socialSection: {
    width: '100%',
    marginTop: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dividerText: {
    color: '#8F9BB3',
    paddingHorizontal: 10,
    fontSize: 14,
  },
}); 