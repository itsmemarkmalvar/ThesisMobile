export const getShadowStyle = (elevation = 3) => ({
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: elevation,
  },
  shadowOpacity: 0.1,
  shadowRadius: elevation,
  elevation: elevation,
});

// Predefined shadow styles
export const shadowStyles = {
  small: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
}; 