import { useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { userService } from '../services/databaseService'
import type { User } from '../types/database'

export function useUserData() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function syncUser() {
      if (!isLoaded) return
      
      if (!user) {
        setUserData(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Get the JWT token from Clerk (uses default claims)
        const token = await getToken()
        console.log('Got JWT token from Clerk:', !!token)
        if (!token) {
          console.warn('No JWT token received from Clerk')
        }

        // Sync user to database
        const syncedUser = await userService.upsertUser({
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          full_name: user.fullName || undefined,
          username: user.username || undefined,
          avatar_url: user.imageUrl || undefined,
          bio: user.publicMetadata?.bio as string || undefined
        }, token || undefined)

        if (!syncedUser && !token) {
          console.warn('User sync failed - trying without token as fallback')
          // Try again without token as fallback
          const fallbackUser = await userService.upsertUser({
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            full_name: user.fullName || undefined,
            username: user.username || undefined,
            avatar_url: user.imageUrl || undefined,
            bio: user.publicMetadata?.bio as string || undefined
          })
          
          if (fallbackUser) {
            console.log('User synced successfully with fallback method:', fallbackUser)
            setUserData(fallbackUser)
            return
          }
        }

        if (syncedUser) {
          console.log('User synced successfully:', syncedUser)
          setUserData(syncedUser)
        } else {
          console.error('Failed to sync user to database')
          setError('Failed to sync user data')
        }
      } catch (err) {
        console.error('Error syncing user:', err)
        setError('Error syncing user data')
      } finally {
        setLoading(false)
      }
    }

    syncUser()
  }, [user, isLoaded, getToken])

  return {
    userData,
    loading,
    error,
    refetch: () => {
      setLoading(true)
      // This will trigger the useEffect again
    }
  }
} 