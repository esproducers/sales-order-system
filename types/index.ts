export interface Profile {
    id: string
    user_id: string
    name: string
    email: string
    phone: string
    role: 'admin' | 'agent'
    commission_rate: number
    created_at: string
  }
  
  export interface Client {
    id: string
    company_name: string
    ssm_id: string
    tin_id: string
    address: string
    company_phone: string
    contact_phone: string
    ssm_file_url: string
    agent_id: string
    created_at: string
  }
  
  export interface Order {
    id: string
    client_id: string
    agent_id: string
    purchase_date: string
    item_name: string
    quantity: number
    price: number
    total_amount: number
    commission_amount: number
    status: 'active' | 'cancelled'
    created_at: string
    can_edit_until: string
    can_delete_until: string
    client?: Client
    agent?: Profile
  }
  
  export interface BackupHistory {
    id: string
    backup_type: string
    file_url: string
    record_count: number
    backup_date: string
    status: string
  }