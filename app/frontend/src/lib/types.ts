export type UserRole = 'ADMIN' | 'CLIENT' | 'PARTNER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  client_id?: string;
  partner_id?: string;
}

export type FormType = 'INSPECTION' | 'MAINTENANCE' | 'WARRANTY_CLAIM';

export interface Unit {
  id: string;
  serial_number: string;
  model_name: string;
  client_id?: string;
  client?: {
    company_name: string;
  };
}
