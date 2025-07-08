import { useState, useEffect } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { projectService } from '../services/databaseService'
import type { Project } from '../types/database'
import { useUserData } from './useUserData'

export function useProjects() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const { userData } = useUserData()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  const loadUserProjects = async () => {
    if (!user || !userData) return

    setLoading(true)
    try {
      // Get the JWT token from Clerk (uses default claims)
      const token = await getToken()
      
      const userProjects = await projectService.getUserProjects(user.id, token || undefined)
      setProjects(userProjects)
    } catch (error) {
      console.error('Error loading user projects:', error)
      // Don't crash the app, just log the error and set empty array
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData: {
    name: string
    description: string
    prompt: string
    generated_code: string
    preview_html: string
    is_public: boolean
    allow_remix: boolean
    category: string
    original_project_id?: string
  }) => {
    if (!user || !userData) {
      console.error('User or userData not available:', { user: !!user, userData: !!userData });
      return null;
    }

    try {
      console.log('Creating project in useProjects hook:', { userData: userData.id, projectName: projectData.name });
      
      // Get the JWT token from Clerk
      const token = await getToken()
      console.log('Got token:', !!token);
      
      const newProject = await projectService.createProject({
        ...projectData,
        user_id: user.id // Use Clerk ID, not Supabase user ID
      }, token || undefined)
      
      if (newProject) {
        setProjects(prev => [newProject, ...prev])
      }
      
      return newProject
    } catch (error) {
      console.error('Error creating project:', error)
      return null
    }
  }

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    if (!user || !userData) return null

    try {
      const token = await getToken()
      const updatedProject = await projectService.updateProject(projectId, updates, token || undefined)
      
      if (updatedProject) {
        setProjects(prev => 
          prev.map(project => 
            project.id === projectId ? updatedProject : project
          )
        )
      }
      
      return updatedProject
    } catch (error) {
      console.error('Error updating project:', error)
      return null
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!user || !userData) return false

    try {
      const token = await getToken()
      const success = await projectService.deleteProject(projectId, token || undefined)
      
      if (success) {
        setProjects(prev => prev.filter(project => project.id !== projectId))
      }
      
      return success
    } catch (error) {
      console.error('Error deleting project:', error)
      return false
    }
  }

  const remixProject = async (originalProjectId: string, newName?: string) => {
    if (!user || !userData) return null

    try {
      const token = await getToken()
      const remixedProject = await projectService.remixProject(originalProjectId, user.id, newName, token || undefined)
      
      if (remixedProject) {
        setProjects(prev => [remixedProject, ...prev])
      }
      
      return remixedProject
    } catch (error) {
      console.error('Error remixing project:', error)
      return null
    }
  }

  useEffect(() => {
    if (user && userData) {
      loadUserProjects()
    } else {
      setProjects([])
    }
  }, [user, userData])

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    remixProject,
    refreshProjects: loadUserProjects
  }
}

export function useTopLikedProjects() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  const loadTopLikedProjects = async (limit: number = 4) => {
    setLoading(true)
    try {
      const topProjects = await projectService.getTopLikedProjects(limit)
      setProjects(topProjects)
    } catch (error) {
      console.error('Error loading top liked projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTopLikedProjects()
  }, [])

  const likeProject = async (projectId: string) => {
    if (!user) return false

    try {
      const token = await getToken()
      const success = await projectService.toggleProjectLike(projectId, user.id, token || undefined)
      if (success) {
        // Refresh projects to get updated like counts
        await loadTopLikedProjects()
      }
      return success
    } catch (error) {
      console.error('Error liking project:', error)
      return false
    }
  }

  return {
    projects,
    loading,
    refreshTopLikedProjects: loadTopLikedProjects,
    likeProject
  }
}

export function usePublicProjects() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  const loadPublicProjects = async (category?: string, search?: string) => {
    setLoading(true)
    try {
      const publicProjects = await projectService.getPublicProjects(category, search)
      setProjects(publicProjects)
    } catch (error) {
      console.error('Error loading public projects:', error)
      // Don't crash the app, just log the error and set empty array
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const likeProject = async (projectId: string) => {
    if (!user) return false

    try {
      const token = await getToken()
      const success = await projectService.toggleProjectLike(projectId, user.id, token || undefined)
      if (success) {
        // Refresh projects to get updated like counts
        await loadPublicProjects()
      }
      return success
    } catch (error) {
      console.error('Error liking project:', error)
      return false
    }
  }

  const recordView = async (projectId: string) => {
    try {
      await projectService.recordProjectView(projectId, user?.id)
    } catch (error) {
      console.error('Error recording view:', error)
    }
  }

  return {
    projects,
    loading,
    loadPublicProjects,
    likeProject,
    recordView
  }
}

export function useSavedProjects() {
  const { user } = useUser()
  const [savedProjects, setSavedProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  const loadSavedProjects = async () => {
    if (!user) return

    setLoading(true)
    try {
      const projects = await projectService.getUserSavedProjects(user.id)
      setSavedProjects(projects)
    } catch (error) {
      console.error('Error loading saved projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProject = async (projectId: string) => {
    if (!user) return false

    try {
      const success = await projectService.saveProject(projectId, user.id)
      if (success) {
        await loadSavedProjects()
      }
      return success
    } catch (error) {
      console.error('Error saving project:', error)
      return false
    }
  }

  const unsaveProject = async (projectId: string) => {
    if (!user) return false

    try {
      const success = await projectService.unsaveProject(projectId, user.id)
      if (success) {
        setSavedProjects(prev => prev.filter(project => project.id !== projectId))
      }
      return success
    } catch (error) {
      console.error('Error removing saved project:', error)
      return false
    }
  }

  const isProjectSaved = async (projectId: string) => {
    if (!user) return false

    try {
      return await projectService.isProjectSaved(projectId, user.id)
    } catch (error) {
      console.error('Error checking if project is saved:', error)
      return false
    }
  }

  useEffect(() => {
    if (user) {
      loadSavedProjects()
    } else {
      setSavedProjects([])
    }
  }, [user])

  return {
    savedProjects,
    loading,
    saveProject,
    unsaveProject,
    isProjectSaved,
    refreshSavedProjects: loadSavedProjects
  }
} 