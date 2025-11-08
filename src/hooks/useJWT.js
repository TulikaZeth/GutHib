'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

/**
 * Custom hook for JWT token management
 * Automatically generates and manages JWT tokens for authenticated users
 */
export function useJWT() {
  const { user, isLoading } = useUser();
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  /**
   * Generate a new JWT token
   */
  const generateToken = async () => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setTokenLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/token');
      
      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const data = await response.json();
      setToken(data.token);
      return data.token;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setTokenLoading(false);
    }
  };

  /**
   * Make an authenticated API call with JWT token
   */
  const authenticatedFetch = async (url, options = {}) => {
    if (!token) {
      await generateToken();
    }

    const currentToken = token || await generateToken();

    if (!currentToken) {
      throw new Error('Failed to get authentication token');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  };

  /**
   * Clear the stored token
   */
  const clearToken = () => {
    setToken(null);
    setError(null);
  };

  return {
    token,
    tokenLoading,
    error,
    generateToken,
    authenticatedFetch,
    clearToken,
    isAuthenticated: !!user && !isLoading,
  };
}

/**
 * Example usage:
 * 
 * const { token, generateToken, authenticatedFetch } = useJWT();
 * 
 * // Generate token
 * await generateToken();
 * 
 * // Make authenticated API call
 * const data = await authenticatedFetch('/api/protected/data');
 */
