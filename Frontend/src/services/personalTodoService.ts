import { apiClient, ApiResponse } from '@/lib/api';
import {
  PersonalTodoCreateDto,
  PersonalTodoReadDto,
  PersonalTodoUpdateDto,
  PersonalTodoPriority,
  PersonalTodoStatus,
} from '@/types/taskTypes';

// ======================================================================================
// Local Storage Keys
// ======================================================================================
const PERSONAL_TODOS_KEY = 'personalTodos';

// ======================================================================================
// Helper function to extract data from ApiResponse
// ======================================================================================
async function handleResponse<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const response = await promise;
  console.log('🔍 handleResponse received:', response);
  
  if (response.success && response.data !== null) {
    // The API client wraps the backend response, so we need to extract the actual data
    const backendResponse = response.data as any;
    console.log('🔍 Backend response structure:', backendResponse);
    
    // If the backend response has a 'data' property, extract it
    if (backendResponse && backendResponse.data) {
      // Check if it's an array
      if (Array.isArray(backendResponse.data)) {
        console.log('✅ handleResponse returning array data:', backendResponse.data);
        return backendResponse.data as T;
      }
      // Check if it's a single object (for update/create operations)
      if (typeof backendResponse.data === 'object') {
        console.log('✅ handleResponse returning object data:', backendResponse.data);
        return backendResponse.data as T;
      }
    }
    
    // If it's already the data we want, return it directly
    console.log('✅ handleResponse returning direct data:', backendResponse);
    return backendResponse as T;
  } else {
    console.error('❌ handleResponse failed:', response.message);
    throw new Error(response.message || 'API request failed');
  }
}

async function handleVoidResponse(promise: Promise<ApiResponse<void>>): Promise<void> {
    const response = await promise;
    if (!response.success) {
        throw new Error(response.message || 'API request failed');
    }
}

// ======================================================================================
// Local Storage Helpers
// ======================================================================================
function getPersonalTodosFromStorage(): PersonalTodoReadDto[] {
  try {
    const stored = localStorage.getItem(PERSONAL_TODOS_KEY);
    if (!stored) return [];
    
    const todos = JSON.parse(stored);
    console.log('Raw todos from storage:', todos);
    
    // Convert old format to new format if needed
    return todos.map((todo: any) => {
      // Check if this is old format (has 'id' and 'title' fields)
      if (todo.id && todo.title && !todo.todoId && !todo.task) {
        console.log('Converting old format todo:', todo);
        return {
          todoId: todo.id,
          task: todo.title,
          description: todo.description,
          isCompleted: todo.isCompleted || false,
          progress: todo.progress || 0,
          createdAt: todo.createdAt ? new Date(todo.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: todo.updatedAt ? new Date(todo.updatedAt).toISOString() : new Date().toISOString(),
          dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : undefined,
          priority: todo.priority || PersonalTodoPriority.Medium,
          status: todo.status || PersonalTodoStatus.Pending,
          enableReminders: todo.enableReminders || true,
          reminderHoursBeforeDue: todo.reminderHoursBeforeDue || 24,
          enableEmailReminders: todo.enableEmailReminders || true,
          enablePushNotifications: todo.enablePushNotifications || true,
          enableSmsReminders: todo.enableSmsReminders || false,
          tags: todo.tags,
          notes: todo.notes,
          isRecurring: todo.isRecurring || false,
          recurrencePattern: todo.recurrencePattern,
          isOverdue: false,
          needsReminder: false
        };
      }
      // If it's already in new format, return as is
      return todo;
    });
  } catch (error) {
    console.error('Error reading personal todos from storage:', error);
    return [];
  }
}

function savePersonalTodosToStorage(todos: PersonalTodoReadDto[]): void {
  try {
    localStorage.setItem(PERSONAL_TODOS_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error('Error saving personal todos to storage:', error);
  }
}

function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// ======================================================================================
// PersonalTodo Service
// ======================================================================================

// ======================================================================================
// Debug and Migration Helpers
// ======================================================================================

export const personalTodoDebug = {
  /**
   * Clear all personal todos from local storage
   */
  clearStorage: () => {
    localStorage.removeItem(PERSONAL_TODOS_KEY);
    console.log('Personal todos storage cleared');
  },

  /**
   * Show what's currently in storage
   */
  showStorage: () => {
    const stored = localStorage.getItem(PERSONAL_TODOS_KEY);
    console.log('Current storage content:', stored);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('Parsed storage content:', parsed);
      } catch (e) {
        console.error('Error parsing storage:', e);
      }
    }
  },

  /**
   * Migrate old format todos to new format
   */
  migrateStorage: () => {
    const todos = getPersonalTodosFromStorage();
    console.log('Migrated todos:', todos);
    savePersonalTodosToStorage(todos);
    return todos;
  },

  /**
   * Test API connection
   */
  testApiConnection: async () => {
    console.log('🧪 Testing API connection...');
    console.log('🌐 API Base URL:', apiClient['axiosInstance'].defaults.baseURL);
    console.log('🔑 Auth Header:', apiClient['axiosInstance'].defaults.headers.common['Authorization']);
    
    try {
      // Test the PersonalTodo endpoint
      const response = await apiClient.get("/PersonalTodo");
      console.log('✅ API Connection successful!');
      console.log('📡 Response:', response);
      return response;
    } catch (error) {
      console.error('❌ API Connection failed:', error);
      console.log('💡 Make sure:');
      console.log('   1. Backend is running (check Swagger)');
      console.log('   2. Backend URL matches frontend config');
      console.log('   3. You are authenticated (check auth token)');
      return null;
    }
  }
};

export const personalTodoService = {
  /**
   * Creates a new personal todo item.
   * Falls back to local storage if API fails.
   * @param payload - The data for creating the todo.
   * @returns A promise that resolves to the created todo.
   */
  create: async (payload: PersonalTodoCreateDto): Promise<PersonalTodoReadDto> => {
    try {
      // Try API first - use correct endpoint
      return await handleResponse(apiClient.post<PersonalTodoReadDto>("/PersonalTodo", payload));
    } catch (error) {
      console.log('API failed, using local storage for personal todo creation:', error);
      
      // Fallback to local storage
      const newTodo: PersonalTodoReadDto = {
        todoId: generateId(),
        task: payload.task,
        description: payload.description,
        dueDate: payload.dueDate,
        priority: payload.priority || PersonalTodoPriority.Medium,
        isCompleted: false,
        progress: 0,
        status: PersonalTodoStatus.Pending,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        enableReminders: payload.enableReminders || true,
        reminderHoursBeforeDue: payload.reminderHoursBeforeDue || 24,
        enableEmailReminders: payload.enableEmailReminders || true,
        enablePushNotifications: payload.enablePushNotifications || true,
        enableSmsReminders: payload.enableSmsReminders || false,
        tags: payload.tags,
        notes: payload.notes,
        isRecurring: payload.isRecurring || false,
        recurrencePattern: payload.recurrencePattern,
        isOverdue: false,
        needsReminder: false
      };
      
      const todos = getPersonalTodosFromStorage();
      todos.push(newTodo);
      savePersonalTodosToStorage(todos);
      
      return newTodo;
    }
  },

  /**
   * Retrieves all personal todos for the current user.
   * Falls back to local storage if API fails.
   * @returns A promise that resolves to a list of personal todos.
   */
  getUserTodos: async (): Promise<PersonalTodoReadDto[]> => {
    try {
      console.log('🔄 Attempting to fetch todos from API...');
      console.log('🌐 API Base URL:', apiClient['axiosInstance'].defaults.baseURL);
      console.log('🔑 Auth Header:', apiClient['axiosInstance'].defaults.headers.common['Authorization']);
      
      // Try API first - use correct endpoint
      const result = await handleResponse(apiClient.get<PersonalTodoReadDto[]>("/PersonalTodo"));
      console.log('✅ Processed API response for getUserTodos:', result);
      
      // Ensure we return an array
      if (!Array.isArray(result)) {
        console.warn('⚠️ API returned non-array, converting to array:', result);
        return Array.isArray(result) ? result : [];
      }
      
      console.log(`🎯 Successfully fetched ${result.length} todos from API`);
      return result;
    } catch (error) {
      console.error('❌ API failed, error details:', error);
      console.log('🔄 Falling back to local storage for personal todos');
      
      // Fallback to local storage
      const localTodos = getPersonalTodosFromStorage();
      console.log('💾 Local storage todos:', localTodos);
      return Array.isArray(localTodos) ? localTodos : [];
    }
  },

  /**
   * Retrieves a single personal todo by its ID.
   * Falls back to local storage if API fails.
   * @param id - The ID of the todo.
   * @returns A promise that resolves to the todo data.
   */
  getById: async (id: number): Promise<PersonalTodoReadDto> => {
    try {
      // Try API first - use correct endpoint
      return await handleResponse(apiClient.get<PersonalTodoReadDto>(`/PersonalTodo/${id}`));
    } catch (error) {
      console.log('API failed, using local storage for personal todo getById:', error);
      
      // Fallback to local storage
      const todos = getPersonalTodosFromStorage();
      const todo = todos.find(t => t.todoId === id);
      if (!todo) {
        throw new Error(`Personal todo with id ${id} not found`);
      }
      return todo;
    }
  },

  /**
   * Updates an existing personal todo.
   * Falls back to local storage if API fails.
   * @param id - The ID of the todo to update.
   * @param payload - The data for updating the todo.
   * @returns A promise that resolves to the updated todo.
   */
  update: async (id: number, payload: PersonalTodoUpdateDto): Promise<PersonalTodoReadDto> => {
    try {
      // Try API first - use correct endpoint
      return await handleResponse(apiClient.put<PersonalTodoReadDto>(`/PersonalTodo/${id}`, payload));
    } catch (error) {
      console.log('API failed, using local storage for personal todo update:', error);
      
      // Fallback to local storage
      const todos = getPersonalTodosFromStorage();
      const todoIndex = todos.findIndex(t => t.todoId === id);
      if (todoIndex === -1) {
        throw new Error(`Personal todo with id ${id} not found`);
      }
      
      const updatedTodo = {
        ...todos[todoIndex],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      
      todos[todoIndex] = updatedTodo;
      savePersonalTodosToStorage(todos);
      
      return updatedTodo;
    }
  },

  /**
   * Deletes a personal todo by its ID.
   * Falls back to local storage if API fails.
   * @param id - The ID of the todo to delete.
   * @returns A promise that resolves when the todo is deleted.
   */
  delete: async (id: number): Promise<void> => {
    try {
      // Try API first - use correct endpoint
      return await handleVoidResponse(apiClient.delete<void>(`/PersonalTodo/${id}`));
    } catch (error) {
      console.log('API failed, using local storage for personal todo delete:', error);
      
      // Fallback to local storage
      const todos = getPersonalTodosFromStorage();
      const filteredTodos = todos.filter(t => t.todoId !== id);
      
      if (filteredTodos.length === todos.length) {
        throw new Error(`Personal todo with id ${id} not found`);
      }
      
      savePersonalTodosToStorage(filteredTodos);
    }
  },
};