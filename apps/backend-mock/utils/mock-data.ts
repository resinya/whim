export interface UserInfo {
  email?: string;
  id: number;
  password: string;
  realName: string;
  roles: string[];
  username: string;
  homePath?: string;
}

export interface TimezoneOption {
  offset: number;
  timezone: string;
}

export const MOCK_USERS: UserInfo[] = [
  {
    id: 0,
    password: '123456',
    realName: 'resin',
    email: '2970768980@qq.com',
    roles: ['super'],
    username: 'resin',
    homePath: '/dashboard/workspace',
  },
  {
    id: 1,
    password: '123456',
    realName: 'Admin',
    roles: ['admin'],
    username: 'admin',
    homePath: '/dashboard/workspace',
  },
  {
    id: 2,
    password: '123456',
    realName: 'Jack',
    roles: ['user'],
    username: 'jack',
    homePath: '/dashboard/analytics',
  },
];

export const MOCK_CODES = [
  // super
  {
    codes: ['AC_100100', 'AC_100110', 'AC_100120', 'AC_100010'],
    username: 'resin',
  },
  {
    // admin
    codes: ['AC_100010', 'AC_100020', 'AC_100030'],
    username: 'admin',
  },
  {
    // user
    codes: ['AC_1000001', 'AC_1000002'],
    username: 'jack',
  },
];

const dashboardMenus = [
  {
    meta: {
      order: -1,
      title: 'page.dashboard.title',
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/dashboard/analytics',
    children: [
      {
        name: 'Analytics',
        path: 'analytics',
        component: '/dashboard/analytics/index',
        meta: {
          affixTab: true,
          title: 'page.dashboard.analytics',
        },
      },
      {
        name: 'Workspace',
        path: 'workspace',
        component: '/dashboard/workspace/index',
        meta: {
          title: 'page.dashboard.workspace',
        },
      },
    ],
  },
];

const createDemosMenus = (role: 'admin' | 'super' | 'user') => {
  const roleWithMenus = {
    admin: {
      component: '/demos/access/admin-visible',
      meta: {
        icon: 'mdi:button-cursor',
        title: 'demos.access.adminVisible',
      },
      name: 'AccessAdminVisibleDemo',
      path: 'admin-visible',
    },
    super: {
      component: '/demos/access/super-visible',
      meta: {
        icon: 'mdi:button-cursor',
        title: 'demos.access.superVisible',
      },
      name: 'AccessSuperVisibleDemo',
      path: 'super-visible',
    },
    user: {
      component: '/demos/access/user-visible',
      meta: {
        icon: 'mdi:button-cursor',
        title: 'demos.access.userVisible',
      },
      name: 'AccessUserVisibleDemo',
      path: 'user-visible',
    },
  };

  return [
    {
      meta: {
        icon: 'ic:baseline-view-in-ar',
        keepAlive: true,
        order: 1000,
        title: 'demos.title',
      },
      name: 'Demos',
      path: '/demos',
      redirect: '/demos/access',
      children: [
        {
          name: 'AccessDemos',
          path: 'access',
          meta: {
            icon: 'mdi:cloud-key-outline',
            title: 'demos.access.backendPermissions',
          },
          redirect: '/demos/access/page-control',
          children: [
            {
              name: 'AccessPageControlDemo',
              path: 'page-control',
              component: '/demos/access/index',
              meta: {
                icon: 'mdi:page-previous-outline',
                title: 'demos.access.pageAccess',
              },
            },
            {
              name: 'AccessButtonControlDemo',
              path: 'button-control',
              component: '/demos/access/button-control',
              meta: {
                icon: 'mdi:button-cursor',
                title: 'demos.access.buttonControl',
              },
            },
            {
              name: 'AccessMenuVisible403Demo',
              path: 'menu-visible-403',
              component: '/demos/access/menu-visible-403',
              meta: {
                authority: ['no-body'],
                icon: 'mdi:button-cursor',
                menuVisibleWithForbidden: true,
                title: 'demos.access.menuVisible403',
              },
            },
            roleWithMenus[role],
          ],
        },
      ],
    },
  ];
};

export const MOCK_MENUS = [
  {
    menus: [...dashboardMenus, ...createDemosMenus('super')],
    username: 'resin',
  },
  {
    menus: [...dashboardMenus, ...createDemosMenus('admin')],
    username: 'admin',
  },
  {
    menus: [...dashboardMenus, ...createDemosMenus('user')],
    username: 'jack',
  },
];

export const MOCK_MENU_LIST = [
  {
    id: 1,
    name: 'Dashboard',
    status: 1,
    type: 'catalog',
    icon: 'lucide:layout-dashboard',
    path: '/dashboard',
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: 'page.dashboard.title',
    },
    children: [
      {
        id: 101,
        pid: 1,
        status: 1,
        type: 'menu',
        name: 'Analytics',
        path: 'analytics',
        component: '/dashboard/analytics/index',
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: 'page.dashboard.analytics',
          keepAlive: true,
        },
      },
      {
        id: 102,
        pid: 1,
        status: 1,
        type: 'menu',
        name: 'Workspace',
        path: 'workspace',
        component: '/views/dashboard/workspace/index',
        meta: {
          icon: 'carbon:workspace',
          title: 'page.dashboard.workspace',
        },
      },
    ],
  },
  {
    id: 2,
    meta: {
      icon: 'carbon:settings',
      order: 9997,
      title: 'system.title',
      badge: 'new',
      badgeType: 'normal',
      badgeVariants: 'primary',
    },
    status: 1,
    type: 'catalog',
    name: 'System',
    path: '/system',
    children: [
      {
        id: 201,
        pid: 2,
        path: '/system/menu',
        name: 'SystemMenu',
        authCode: 'System:Menu:List',
        status: 1,
        type: 'menu',
        meta: {
          icon: 'carbon:menu',
          title: 'system.menu.title',
        },
        component: '/system/menu/list',
        children: [
          {
            id: 20_101,
            pid: 201,
            name: 'SystemMenuCreate',
            status: 1,
            type: 'button',
            authCode: 'System:Menu:Create',
            meta: { title: 'common.create' },
          },
          {
            id: 20_102,
            pid: 201,
            name: 'SystemMenuEdit',
            status: 1,
            type: 'button',
            authCode: 'System:Menu:Edit',
            meta: { title: 'common.edit' },
          },
          {
            id: 20_103,
            pid: 201,
            name: 'SystemMenuDelete',
            status: 1,
            type: 'button',
            authCode: 'System:Menu:Delete',
            meta: { title: 'common.delete' },
          },
        ],
      },
      {
        id: 202,
        pid: 2,
        path: '/system/dept',
        name: 'SystemDept',
        status: 1,
        type: 'menu',
        authCode: 'System:Dept:List',
        meta: {
          icon: 'carbon:container-services',
          title: 'system.dept.title',
        },
        component: '/system/dept/list',
        children: [
          {
            id: 20_401,
            pid: 202,
            name: 'SystemDeptCreate',
            status: 1,
            type: 'button',
            authCode: 'System:Dept:Create',
            meta: { title: 'common.create' },
          },
          {
            id: 20_402,
            pid: 202,
            name: 'SystemDeptEdit',
            status: 1,
            type: 'button',
            authCode: 'System:Dept:Edit',
            meta: { title: 'common.edit' },
          },
          {
            id: 20_403,
            pid: 202,
            name: 'SystemDeptDelete',
            status: 1,
            type: 'button',
            authCode: 'System:Dept:Delete',
            meta: { title: 'common.delete' },
          },
        ],
      },
    ],
  },
];

export function getMenuIds(menus: any[]) {
  const ids: number[] = [];
  menus.forEach((item) => {
    ids.push(item.id);
    if (item.children && item.children.length > 0) {
      ids.push(...getMenuIds(item.children));
    }
  });
  return ids;
}

/**
 * 时区选项
 */
export const TIME_ZONE_OPTIONS: TimezoneOption[] = [
  {
    offset: -5,
    timezone: 'America/New_York',
  },
  {
    offset: 0,
    timezone: 'Europe/London',
  },
  {
    offset: 8,
    timezone: 'Asia/Shanghai',
  },
  {
    offset: 9,
    timezone: 'Asia/Tokyo',
  },
  {
    offset: 9,
    timezone: 'Asia/Seoul',
  },
];
