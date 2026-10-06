import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getProfile = async (req, res) => {
  try {
    return sendSuccess(res, 200, 'Profile fetched.', { user: req.user.toProfile() });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch profile.');
  }
};

export const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'age', 'role', 'mobile', 'studyOrPreparation', 'institution', 'experienceLevel', 'themePreference'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, 'No valid fields to update.');
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, 200, 'Profile updated successfully.', { user: user.toProfile() });
  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, 500, 'Failed to update profile.');
  }
};
