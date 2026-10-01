import { useState, useEffect } from 'react';
import type { ConfigData, StatusData, Category, Command } from '../types';

import fallbackConfig from '../data/config.json';
import fallbackStatus from '../data/status.json';
import fallbackCategories from '../data/categories.json';
import fallbackCommands from '../data/commands.json';

export function useConfig() {
  const [config, setConfig] = useState<ConfigData>(fallbackConfig as ConfigData);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.inviteUrl) {
          setConfig(data);
        }
      })
      .catch(() => {});
  }, []);

  return config;
}

export function useStatus(pollIntervalMs = 30000) {
  const [status, setStatus] = useState<StatusData>(fallbackStatus as StatusData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Status failed');
      const data = await res.json();
      setStatus(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    if (pollIntervalMs > 0) {
      const interval = setInterval(fetchStatus, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [pollIntervalMs]);

  return { status, loading, error, refresh: fetchStatus };
}

export function useCommands() {
  const [categories, setCategories] = useState<Category[]>(fallbackCategories.categories as Category[]);
  const [commands, setCommands] = useState<Command[]>(fallbackCommands.commands as Command[]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, cmdRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/commands')
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData?.categories) setCategories(catData.categories);
      }

      if (cmdRes.ok) {
        const cmdData = await cmdRes.json();
        if (cmdData?.commands) setCommands(cmdData.commands);
      }
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { categories, commands, loading, error, refresh: fetchData };
}
