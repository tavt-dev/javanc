export interface NotificationDTO {
  id: number;
  message: string;
  createAt?: string;
  url?: string;
  read: boolean;
  idUser: number;
}

export interface MessageDTO {
  message: string;
  id: number;
}
