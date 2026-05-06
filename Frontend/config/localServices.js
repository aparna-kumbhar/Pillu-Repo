import { fetchWithBaseUrlFallback } from '../Src/axios';

const toJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const studentService = {
  async getByInstitute(instituteId) {
    const id = (instituteId || '').trim();
    if (!id) {
      return { success: false, error: 'instituteId is required', data: [] };
    }

    try {
      const { response } = await fetchWithBaseUrlFallback(`/api/students?instituteId=${encodeURIComponent(id)}`);
      const payload = await toJsonSafe(response);

      if (!response.ok) {
        return {
          success: false,
          error: payload?.message || 'Failed to fetch students',
          data: [],
        };
      }

      return {
        success: true,
        data: Array.isArray(payload) ? payload : [],
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Network error while fetching students',
        data: [],
      };
    }
  },

  async updateProfile(studentId, updatePayload) {
    const id = (studentId || '').trim();
    if (!id) {
      return { success: false, error: 'studentId is required' };
    }

    try {
      const { response } = await fetchWithBaseUrlFallback(`/api/students/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload || {}),
      });

      const payload = await toJsonSafe(response);

      if (!response.ok) {
        return {
          success: false,
          error: payload?.message || 'Failed to update student profile',
        };
      }

      return {
        success: true,
        data: payload || {},
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Network error while updating student profile',
      };
    }
  },
};

export const parentService = {
  async getStoredProfile({ instituteId, parentId, parentPassword }) {
    const pid = (parentId || '').trim();
    const ppass = (parentPassword || '').trim();

    if (!pid || !ppass) {
      return { success: false, error: 'parentId and parentPassword are required' };
    }

    try {
      const { response } = await fetchWithBaseUrlFallback('/api/parents/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId: (instituteId || '').trim(),
          parentId: pid,
          parentPassword: ppass,
        }),
      });

      const payload = await toJsonSafe(response);

      if (!response.ok) {
        return {
          success: false,
          error: payload?.message || 'Failed to load parent profile',
        };
      }

      return {
        success: true,
        data: payload?.parent || payload || {},
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Network error while loading parent profile',
      };
    }
  },

  async saveProfile(profilePayload) {
    try {
      const { response } = await fetchWithBaseUrlFallback('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload || {}),
      });

      const payload = await toJsonSafe(response);

      if (!response.ok) {
        return {
          success: false,
          error: payload?.message || 'Failed to save parent profile',
        };
      }

      return {
        success: true,
        data: payload || {},
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Network error while saving parent profile',
      };
    }
  },
};
