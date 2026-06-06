export type User = {
  id: string;
  name: string;
  email: string;
  img: string | null;
  credits: number;
  createdAt?: Date;
  updatedAt?: Date;
}
