export interface ValidationFields {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
}

export interface ValidationErrors {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
}

export const validateFields = (fields: ValidationFields): ValidationErrors => {
  let errors: ValidationErrors = {};

  if (fields.email !== undefined) {
    if (!fields.email) {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(fields.email)) {
      errors.email = "Enter a valid email address.";
    }
  }

  if (fields.password !== undefined) {
    if (!fields.password) {
      errors.password = "Password is required.";
    } else if (fields.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
  }

  
  if (fields.fullName !== undefined) {
    if (!fields.fullName) {
      errors.fullName = "Full name is required.";
    } else if (fields.fullName.trim().split(" ").length < 2) {
      errors.fullName = "Enter your full name.";
    }
  }

  if (fields.phone !== undefined) {
    if (!fields.phone) {
      errors.phone = "Phone number is required.";
    } else if (fields.phone.length < 10) {
      errors.phone = "Enter a valid phone number.";
    }
  }

  return errors;
};
