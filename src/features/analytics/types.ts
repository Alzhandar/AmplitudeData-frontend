export type DailyActivityItem = {
  date: string;
  user_id: string;
  device_id: string;
  phone_number: string | null;
  platform: string;
  device_brand: string;
  device_manufacturer: string;
  device_model: string;
  visits_count: number;
  visit_times: string[];
  first_seen: string;
  last_seen: string;
};

export type PresenceStats = {
  start_date: string;
  end_date: string;
  window_hours: number;
  unique_users_total: number;
  users_with_phone: number;
  users_without_phone: number;
  in_location_users: number;
  not_in_location_users: number;
  visit_records_total: number;
  matched_visit_records: number;
};