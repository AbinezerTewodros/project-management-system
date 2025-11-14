import axios, { AxiosError } from 'axios';
import {
  ProjectTaskCreateDto,
  ProjectTaskReadDto,
  PaginatedResult,
  TaskPriority,
  TaskStatus,
} from '@/types/taskTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized endpoints
const ENDPOINTS = {
  CREATE: '/ProjectTask/create-task',
  ALL: '/ProjectTask/Get-all-tasks',
  BY_ID: (id: number) => `/ProjectTask/Get-task-by-id/${id}`,
  FILTER: '/ProjectTask/filter',
  UPDATE: (id: number) => `/ProjectTask/update-task/${id}`,
  PROGRESS: (id: number) => `/ProjectTask/${id}/progress`,
  DELETE: (id: number) => `/ProjectTask/Delete-task?id=${id}`,
  COMMENTS: (id: number) => `/ProjectTask/${id}/comments`,
};

// Handle API errors
function handleError(error: unknown): never {
  const axiosError = error as AxiosError<{ message?: string }>;
  const message =
    axiosError.response?.data?.message ||
    axiosError.message ||
    'An unexpected error occurred';
  throw new Error(message);
}

export const taskService = {
  // Create task
  createTask: async (
    taskData: ProjectTaskCreateDto
  ): Promise<ProjectTaskReadDto> => {
    try {
      const response = await api.post(ENDPOINTS.CREATE, taskData);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Get all tasks
  getAllTasks: async (): Promise<ProjectTaskReadDto[]> => {
    try {
      const response = await api.get(ENDPOINTS.ALL);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Get task by ID
  getTaskById: async (id: number): Promise<ProjectTaskReadDto> => {
    try {
      const response = await api.get(ENDPOINTS.BY_ID(id));
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Filter tasks
  filterTasks: async (filters: {
    projectAssignmentId?: number;
    assignedMemberId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    searchTerm?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PaginatedResult<ProjectTaskReadDto>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`${ENDPOINTS.FILTER}?${params}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Update task
  updateTask: async (
    id: number,
    taskData: Partial<ProjectTaskCreateDto>
  ): Promise<ProjectTaskReadDto> => {
    try {
      const response = await api.put(ENDPOINTS.UPDATE(id), taskData);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Update task progress
  updateProgress: async (
    id: number,
    progress: number
  ): Promise<ProjectTaskReadDto> => {
    try {
      const response = await api.put(ENDPOINTS.PROGRESS(id), { progress });
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Delete task
  deleteTask: async (id: number): Promise<{ success: boolean }> => {
    try {
      const response = await api.delete(ENDPOINTS.DELETE(id));
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Add comment
  addComment: async (
    taskId: number,
    content: string
  ): Promise<{ id: number; content: string; createdAt: string }> => {
    try {
      const response = await api.post(ENDPOINTS.COMMENTS(taskId), { content });
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Get comments
  getComments: async (
    taskId: number
  ): Promise<{ id: number; content: string; createdAt: string }[]> => {
    try {
      const response = await api.get(ENDPOINTS.COMMENTS(taskId));
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },
};
