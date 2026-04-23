export type PushTarget = "phones" | "city";

export type NotificationCityOption = {
  id: number;
  name_ru: string;
  name_kz: string;
};

export type SendPushPayload = {
  target: PushTarget;
  phoneNumbers?: string[];
  excelFile?: File | null;
  cityId?: number;
  title: string;
  body: string;
  titleKz?: string;
  bodyKz?: string;
  notificationType?: string;
};

export type SendPushResponse = {
  target: PushTarget;
  city_id: number | null;
  recipients_count: number | null;
  notification_id: number | null;
  status: string;
};
