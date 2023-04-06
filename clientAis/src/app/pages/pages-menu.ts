import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMSUSER: NbMenuItem[] = [
  {
    title: 'Start',
    icon: 'home-outline',
    link: '/dashboard',
    hidden: true,
    home:true
  },
  {
    title: 'Features for User',
    group: true,
  },
  {
    title: 'Cameras',
    icon: 'video-outline',
    children: [
      {
        title: 'Cameras List',
        link: 'camerasList',
        home: true,
      }
    ],
  },
  {
    title: 'Dashboards',
    icon: 'bar-chart-outline',
    link: 'graphs'
  },
  {
    title: 'Tickets',
    icon: 'done-all-outline',
    link: 'tickets'
  }
];
