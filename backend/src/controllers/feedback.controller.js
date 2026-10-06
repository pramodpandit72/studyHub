import Feedback from '../models/Feedback.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const createFeedback = async (req, res) => {
  try {
    const { rating, category, message, page } = req.body;

    if (!rating) {
      return sendError(res, 400, 'Please select how your experience was (rating).');
    }

    const validRatings = ['Very Good', 'Good', 'Okay', 'Poor', 'Very Poor'];
    if (!validRatings.includes(rating)) {
      return sendError(res, 400, 'Please select a valid rating option.');
    }

    const validCategories = ['Website', 'Meeting', 'Login/Signup', 'Video/Audio', 'Other'];
    const selectedCategory = validCategories.includes(category) ? category : 'Website';

    const feedback = await Feedback.create({
      user: req.user?._id || null,
      rating,
      category: selectedCategory,
      message: (message || '').trim(),
      page: (page || '').trim()
    });

    return sendSuccess(res, 201, 'Thank you for your feedback.', feedback);
  } catch (error) {
    return sendError(res, 500, 'Failed to submit feedback. Please try again.', error.message);
  }
};

export const getMyFeedback = async (req, res) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required.');
    }

    const feedbacks = await Feedback.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return sendSuccess(res, 200, 'Feedback retrieved successfully.', feedbacks);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve feedback.', error.message);
  }
};
