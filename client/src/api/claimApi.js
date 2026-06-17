import axiosInstance from './axiosInstance';

const claimApi = {
  /**
   * Submit a claim.
   * @param {string} itemId
   * @param {Array}  answers        - [{question, providedAnswer}]
   * @param {string} [locationHint] - Where claimant says they lost it
   * @param {string} [reportedTime] - ISO string of when they lost it
   */
  submitClaim: async (itemId, answers, locationHint = '', reportedTime = null) => {
    const payload = { answers };
    if (locationHint) payload.locationHint = locationHint;
    if (reportedTime) payload.reportedTime = reportedTime;
    const response = await axiosInstance.post(`/claims/${itemId}`, payload);
    return response.data;
  },

  /** Get all claims for an item (finder / admin only) */
  getItemClaims: async (itemId) => {
    const response = await axiosInstance.get(`/claims/item/${itemId}`);
    return response.data;
  },

  /** Get the current user's claim for a specific item */
  getMyClaimForItem: async (itemId) => {
    const response = await axiosInstance.get(`/claims/my/${itemId}`);
    return response.data;
  },

  /**
   * Update a claim status (finder: approve / reject / escalate; admin: + disputed)
   * @param {string} claimId
   * @param {string} status   - 'approved' | 'rejected' | 'escalated' | 'disputed'
   * @param {string} [reviewNote] - Optional explanation
   */
  updateClaimStatus: async (claimId, status, reviewNote = '') => {
    const payload = { status };
    if (reviewNote) payload.reviewNote = reviewNote;
    const response = await axiosInstance.put(`/claims/${claimId}`, payload);
    return response.data;
  },

  /** Get fraud-flagged claims (admin only) */
  getFlaggedClaims: async () => {
    const response = await axiosInstance.get('/claims/flagged');
    return response.data;
  },

  /** Get full audit log for a claim (admin / finder of item) */
  getClaimAudit: async (claimId) => {
    const response = await axiosInstance.get(`/claims/${claimId}/audit`);
    return response.data;
  }
};

export default claimApi;
