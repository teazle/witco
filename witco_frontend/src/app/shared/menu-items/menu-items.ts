import { Injectable } from '@angular/core';

export interface BadgeItem {
  type: string;
  value: string;
}
export interface Saperator {
  name: string;
  type?: string;
}
export interface ChildrenItems {
  state: string;
  name: string;
  type?: string;
} 

export interface Menu {
  state: string;
  name: string;
  type: string;
  icon: string;
  badge?: BadgeItem[];
  saperator?: Saperator[];
  children?: ChildrenItems[];
}

const MENUITEMS = [
  {
    state: 'dashboard',
    name: 'Dashboard',
    type: 'link',
    icon: 'dashboard'
  },
  {
    state: 'starter',
    name: 'Drivers',
    type: 'link',
    icon: 'group'
  },
  {
    state: 'customer',
    name: 'Customers',
    type: 'link',
    icon: 'group'
  },
  {
    state: 'delivery-order',
    name: 'Jobs',
    type: 'link',
    icon: 'work'
  },
  {
    state: 'all-do',
    name: 'Delivery Orders',
    type: 'link',
    icon: 'assignment'
  },
 
];
const driverMenu=[
  {
    state: `my-jobs-Delivering`,
    name: 'Delivering',
    type: 'link',
    icon: 'motorcycle'
  },
  {
    state: `my-jobs-Delivered`,
    name: 'Delivered',
    type: 'link',
    icon: 'check_circle'
  },
  {
    state: 'Userprofile',
    name: 'User Profile',
    type: 'link',
    icon: 'account_circle'
  },
  // {
  //   state: 'reset',
  //   name: 'Reset',
  //   type: 'link',
  //   icon: 'lock_open'
  // },
]

@Injectable()
export class MenuItems {
 

  getMenuitem(): Menu[] {
    const user = localStorage.getItem('userData');
    const userData = user ? JSON.parse(user) : null;
    if (!userData || !userData.userRole) {
      return [];
    }
    if (userData.userRole === 'admin') {
      return MENUITEMS;
    }
    if (userData.userRole === 'driver') {
      return driverMenu;
    }
    return [];
  }

}
