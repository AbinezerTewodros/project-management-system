# Frontend Integration Guide

This guide provides practical examples and best practices for integrating with the Project Management System API.

## Quick Start

### 1. Setup API Client

#### Using Axios (Recommended)

```javascript
import axios from "axios";

const API_BASE_URL = "https://localhost:7048/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/Auth/refresh-token`,
            {
              token: refreshToken,
            }
          );
          localStorage.setItem("accessToken", response.data.accessToken);
          localStorage.setItem("refreshToken", response.data.refreshToken);

          // Retry original request
          error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return axios.request(error.config);
        } catch (refreshError) {
          // Redirect to login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### Using Fetch API

```javascript
const API_BASE_URL = "https://localhost:7048/api";

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem("accessToken");
    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    if (response.status === 401) {
      // Handle token refresh
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request(endpoint, options);
      }
    }

    return response;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/Auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return false;
  }
}

export const apiClient = new ApiClient();
```

### 2. Authentication Service

```javascript
class AuthService {
  async login(username, password) {
    try {
      const response = await apiClient.post("/Auth/login", {
        username,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  }

  async logout() {
    try {
      await apiClient.post("/Auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  }

  isAuthenticated() {
    return !!localStorage.getItem("accessToken");
  }

  getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }
}

export const authService = new AuthService();
```

### 3. Project Service

```javascript
class ProjectService {
  async getAllProjects() {
    try {
      const response = await apiClient.get("/Project/All-projects");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch projects",
      };
    }
  }

  async getProjectById(id) {
    try {
      const response = await apiClient.get(`/Project/project-byId?id=${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch project",
      };
    }
  }

  async createProject(projectData) {
    try {
      const response = await apiClient.post(
        "/Project/create-project",
        projectData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to create project",
      };
    }
  }

  async updateProject(id, projectData) {
    try {
      const response = await apiClient.put(
        `/Project/edit-project?id=${id}`,
        projectData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update project",
      };
    }
  }

  async deleteProject(id) {
    try {
      await apiClient.delete(`/Project/delete-project?id=${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to delete project",
      };
    }
  }
}

export const projectService = new ProjectService();
```

### 4. Task Service

```javascript
class TaskService {
  async createTask(taskData) {
    try {
      const response = await apiClient.post(
        "/ProjectTask/create-task",
        taskData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to create task",
      };
    }
  }

  async getTasksByProject(projectId) {
    try {
      const response = await apiClient.get(`/ProjectTask/project/${projectId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch tasks",
      };
    }
  }

  async updateTaskProgress(id, progress) {
    try {
      const response = await apiClient.put(`/ProjectTask/${id}/progress`, {
        progress,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update progress",
      };
    }
  }

  async updateTaskHours(id, actualHours) {
    try {
      const response = await apiClient.put(`/ProjectTask/${id}/hours`, {
        actualHours,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update hours",
      };
    }
  }
}

export const taskService = new TaskService();
```

## React Components Examples

### Login Component

```jsx
import React, { useState } from "react";
import { authService } from "../services/authService";

const Login = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authService.login(
      credentials.username,
      credentials.password
    );

    if (result.success) {
      onLoginSuccess(result.user);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={credentials.username}
        onChange={(e) =>
          setCredentials({ ...credentials, username: e.target.value })
        }
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) =>
          setCredentials({ ...credentials, password: e.target.value })
        }
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};

export default Login;
```

### Project List Component

```jsx
import React, { useState, useEffect } from "react";
import { projectService } from "../services/projectService";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const result = await projectService.getAllProjects();

    if (result.success) {
      setProjects(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="project-list">
      <h2>Projects</h2>
      {projects.map((project) => (
        <div key={project.id} className="project-card">
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <div className="project-meta">
            <span>Status: {project.status}</span>
            <span>Priority: {project.priority}</span>
            <span>Progress: {project.progress}%</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectList;
```

### Task Creation Component

```jsx
import React, { useState } from "react";
import { taskService } from "../services/taskService";

const CreateTask = ({ projectId, onTaskCreated }) => {
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    assignedMemberId: "",
    dueDate: "",
    priority: "Medium",
    estimatedHours: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await taskService.createTask({
      ...taskData,
      projectId: parseInt(projectId),
    });

    if (result.success) {
      onTaskCreated(result.data);
      setTaskData({
        title: "",
        description: "",
        assignedMemberId: "",
        dueDate: "",
        priority: "Medium",
        estimatedHours: 0,
      });
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Task Title"
        value={taskData.title}
        onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
        required
      />
      <textarea
        placeholder="Description"
        value={taskData.description}
        onChange={(e) =>
          setTaskData({ ...taskData, description: e.target.value })
        }
        required
      />
      <input
        type="date"
        value={taskData.dueDate}
        onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
        required
      />
      <select
        value={taskData.priority}
        onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Critical">Critical</option>
      </select>
      <input
        type="number"
        placeholder="Estimated Hours"
        value={taskData.estimatedHours}
        onChange={(e) =>
          setTaskData({
            ...taskData,
            estimatedHours: parseFloat(e.target.value),
          })
        }
        min="0"
        step="0.5"
      />
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Task"}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};

export default CreateTask;
```

## File Upload Example

```jsx
import React, { useState } from "react";
import apiClient from "../services/apiClient";

const FileUpload = ({ entityType, entityId, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);

    try {
      const response = await apiClient.post("/Attachments/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      onUploadComplete(response.data);
      setFile(null);
    } catch (error) {
      setError(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="file-upload">
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {uploading && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
          <span>{progress}%</span>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default FileUpload;
```

## Error Handling

```javascript
// Global error handler
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return `Bad Request: ${data.message || "Invalid data provided"}`;
      case 401:
        return "Unauthorized: Please login again";
      case 403:
        return "Forbidden: You don't have permission to perform this action";
      case 404:
        return "Not Found: The requested resource was not found";
      case 500:
        return "Internal Server Error: Please try again later";
      default:
        return data.message || "An unexpected error occurred";
    }
  } else if (error.request) {
    // Network error
    return "Network Error: Please check your connection";
  } else {
    // Other error
    return error.message || "An error occurred";
  }
};

// Usage in components
try {
  const result = await projectService.createProject(projectData);
  // Handle success
} catch (error) {
  const errorMessage = handleApiError(error);
  setError(errorMessage);
}
```

## Best Practices

### 1. State Management

- Use React Context or Redux for global state
- Keep API calls in services, not components
- Implement proper loading and error states

### 2. Performance

- Implement pagination for large lists
- Use React.memo for expensive components
- Implement proper caching strategies

### 3. Security

- Never store sensitive data in localStorage
- Always validate data before sending to API
- Implement proper input sanitization

### 4. User Experience

- Show loading indicators during API calls
- Provide meaningful error messages
- Implement optimistic updates where appropriate

### 5. Testing

- Mock API responses in tests
- Test error scenarios
- Test loading states

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend allows your frontend domain
2. **Authentication Issues**: Check token expiration and refresh logic
3. **File Upload Failures**: Verify file size limits and supported formats
4. **Network Errors**: Implement retry logic with exponential backoff

### Debug Tips

1. Use browser DevTools to inspect network requests
2. Check console for error messages
3. Verify API endpoints and request/response formats
4. Test with Postman or similar tools first

## Support

For integration issues:

1. Check this documentation first
2. Review the API documentation
3. Contact the backend development team
4. Provide specific error messages and request details
