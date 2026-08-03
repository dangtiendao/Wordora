export type NavigationItem = {
  label: string;
  href: string;
  iconName: string;
  exact?: boolean;
};

export type BaseEntity = {
  id: string;
  createdAt: string;
  updatedAt: string;
};
