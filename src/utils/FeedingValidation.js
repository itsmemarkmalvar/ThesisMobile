export const validateFeedingData = (type, data) => {
  const errors = {};

  // Common validations
  if (!type) {
    errors.type = 'Feeding type is required';
  }

  if (!data.start_time) {
    errors.start_time = 'Start time is required';
  }

  if (data.duration) {
    const duration = parseInt(data.duration);
    if (isNaN(duration) || duration < 0 || duration > 180) {
      errors.duration = 'Duration must be between 0 and 180 minutes';
    }
  }

  // Type-specific validations
  switch (type) {
    case 'breast':
      if (!data.breast_side) {
        errors.breast_side = 'Please select a breast side';
      } else if (!['left', 'right', 'both'].includes(data.breast_side)) {
        errors.breast_side = 'Invalid breast side selected';
      }
      break;

    case 'bottle':
      if (!data.amount) {
        errors.amount = 'Amount is required for bottle feeding';
      } else {
        const amount = parseFloat(data.amount);
        if (isNaN(amount) || amount <= 0 || amount > 500) {
          errors.amount = 'Amount must be between 0 and 500 ml';
        }
      }
      break;

    case 'solid':
      if (!data.food_type || data.food_type.trim().length === 0) {
        errors.food_type = 'Food type is required';
      } else if (data.food_type.trim().length > 100) {
        errors.food_type = 'Food type must be less than 100 characters';
      }
      
      if (data.amount) {
        const amount = parseFloat(data.amount);
        if (isNaN(amount) || amount < 0 || amount > 1000) {
          errors.amount = 'Amount must be between 0 and 1000 grams';
        }
      }
      break;
  }

  // Notes validation
  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Notes must be less than 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 