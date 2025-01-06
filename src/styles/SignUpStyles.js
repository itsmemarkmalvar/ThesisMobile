import { StyleSheet, Platform, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

export const signUpStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: Platform.OS === 'ios' ? 40 : 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
    width: '100%',
    position: 'relative',
    height: 44,
  },
  backButton: {
    padding: 12,
    position: 'absolute',
    left: 0,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A90E2',
    flex: 1,
    textAlign: 'center',
  },
  formContainer: {
    marginTop: 0,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 48,
  },
  inputWrapperError: {
    borderColor: '#FF4B4B',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    paddingLeft: 8,
    paddingVertical: 10,
  },
  passwordToggle: {
    padding: 8,
  },
  bottomSection: {
    marginTop: Platform.OS === 'ios' ? 10 : 20,
  },
  signUpButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  checkbox: {
    marginRight: 10,
  },
  termsText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  termsLink: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  socialButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 24,
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  socialButtonIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 20
  },
  loginText: {
    fontSize: 14,
    color: '#333333',
    marginRight: 4
  },
  loginLink: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    paddingHorizontal: 4
  },
  passwordRequirements: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  requirementsList: {
    marginTop: 4,
  },
  requirementItem: {
    fontSize: 13,
    color: '#666',
    marginVertical: 2,
    paddingLeft: 4,
  },
});