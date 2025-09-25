'use client'

import { useState, useEffect } from 'react'
import { HeatmapResponse, DailyStats, WeeklyStats } from '@/types/api'
import { useAuth } from '@/hooks/useAuth'

export function useStats() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Get heatmap data
  const getHeatmapData = async (params?: { 
    start_date?: string 
    end_date?: string 
  }): Promise<HeatmapResponse> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      if (params?.start_date) {
        queryParams.append('start_date', params.start_date)
      }
      if (params?.end_date) {
        queryParams.append('end_date', params.end_date)
      }

      const response = await fetch(`/api/stats/heatmap?${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch heatmap data')
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Get daily stats
  const getDailyStats = async (params?: {
    start_date?: string
    end_date?: string
  }): Promise<DailyStats[]> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      if (params?.start_date) {
        queryParams.append('start_date', params.start_date)
      }
      if (params?.end_date) {
        queryParams.append('end_date', params.end_date)
      }

      const response = await fetch(`/api/stats/daily?${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily stats')
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Get weekly stats
  const getWeeklyStats = async (weeks = 12): Promise<WeeklyStats[]> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/stats/weekly?weeks=${weeks}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch weekly stats')
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    getHeatmapData,
    getDailyStats,
    getWeeklyStats,
  }
}