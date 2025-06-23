import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { userService } from '../services/databaseService'
import type { User } from '../types/database'

export function useUserData() {
  const { user, isLoaded } = useUser()
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    if (user) {
      // Sync user data with database
      const syncUser = async () => {
        setLoading(true)
        try {
          const userData = await userService.upsertUser({
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            full_name: user.fullName || undefined,
            username: user.username || undefined,
            avatar_url: user.imageUrl || undefined,
            bio: user.publicMetadata?.bio as string || undefined
          })
          setDbUser(userData)
        } catch (error) {
          console.error('Error syncing user:', error)
          // Don't crash the app, just log the error
        } finally {
          setLoading(false)
        }
      }

      syncUser()
    } else {
      setDbUser(null)
      setLoading(false)
    }
  }, [user, isLoaded])

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return null

    try {
      const updatedUser = await userService.updateUser(user.id, updates)
      if (updatedUser) {
        setDbUser(updatedUser)
      }
      return updatedUser
    } catch (error) {
      console.error('Error updating user profile:', error)
      return null
    }
  }

  return {
    user: dbUser,
    clerkUser: user,
    loading,
    updateUserProfile,
    isAuthenticated: !!user
  }
} 