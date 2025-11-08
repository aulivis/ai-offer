'use client';

import { useCallback, useMemo, useState } from 'react';

export type ClientForm = {
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};

export type Client = {
  id: string;
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};

const DEFAULT_CLIENT: ClientForm = {
  company_name: '',
};

/**
 * Hook for managing client autocomplete and selection
 */
export function useClientAutocomplete(clientList: Client[] = []) {
  const [client, setClient] = useState<ClientForm>(DEFAULT_CLIENT);
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredClients = useMemo(() => {
    const query = (client.company_name || '').toLowerCase().trim();
    if (!query) {
      return clientList.slice(0, 8);
    }
    return clientList.filter((c) => c.company_name.toLowerCase().includes(query)).slice(0, 8);
  }, [client.company_name, clientList]);

  const updateClient = useCallback((updates: Partial<ClientForm>) => {
    setClient((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateClientField = useCallback((field: keyof ClientForm, value: string) => {
    setClient((prev) => ({ ...prev, [field]: value }));
  }, []);

  const selectClient = useCallback(
    (selectedClient: Client) => {
      setClientId(selectedClient.id);
      setClient({
        company_name: selectedClient.company_name,
        address: selectedClient.address || '',
        tax_id: selectedClient.tax_id || '',
        representative: selectedClient.representative || '',
        phone: selectedClient.phone || '',
        email: selectedClient.email || '',
      });
      setShowDropdown(false);
    },
    [],
  );

  const reset = useCallback(() => {
    setClient(DEFAULT_CLIENT);
    setClientId(undefined);
    setShowDropdown(false);
  }, []);

  return {
    client,
    clientId,
    showDropdown,
    filteredClients,
    updateClient,
    updateClientField,
    selectClient,
    setShowDropdown,
    reset,
  };
}













