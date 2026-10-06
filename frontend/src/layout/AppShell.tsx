import { Suspense, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Button, Drawer, Dropdown, Grid, Layout, Menu, type MenuProps } from 'antd'
import {
  CrownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/auth/authStore'
import { isSuperAdmin } from '@/auth/roles'
import { CrashScreen } from '@/shared/components/CrashScreen'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { PageLoading } from '@/shared/components/PageState'
import { useGuardedNavigate } from '@/shared/lib/unsavedChanges'
import { ADMIN_NAV, MAIN_NAV } from './nav'
import { selectActiveNav, visibleNav, type NavItem } from './navMatch'
import { TopProgressBar } from './TopProgressBar'
import './AppShell.css'

const { Header, Sider, Content } = Layout
const RIGHT_SIDER_KEY = 'right-sidebar-collapsed'

function readRightCollapsed(): boolean {
  try {
    const saved = localStorage.getItem(RIGHT_SIDER_KEY)
    return saved !== null ? JSON.parse(saved) : true
  } catch {
    return true
  }
}

export function AppShell() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useGuardedNavigate()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [adminDrawerOpen, setAdminDrawerOpen] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(readRightCollapsed)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const showAdminMenu = isSuperAdmin(user)

  useEffect(() => {
    if (screens.md === undefined || isMobile) return
    try {
      localStorage.setItem(RIGHT_SIDER_KEY, JSON.stringify(rightCollapsed))
    } catch {
      // storage unavailable
    }
  }, [rightCollapsed, isMobile, screens.md])

  const mainItems = useMemo(() => visibleNav(MAIN_NAV, user), [user])
  const adminItems = useMemo(() => visibleNav(ADMIN_NAV, user), [user])

  const toMenuItems = (items: NavItem[]): MenuProps['items'] =>
    items.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: <span data-testid={item.testId}>{t(item.labelKey)}</span>,
    }))

  const go = (items: NavItem[], key: string) => {
    const item = items.find((entry) => entry.key === key)
    if (item) navigate(item.path)
  }

  const { main: mainSelected, admin: adminSelected } = selectActiveNav(mainItems, adminItems, location.pathname)

  const sideMenu = (
    <Menu
      data-testid="main-menu"
      mode="inline"
      selectedKeys={mainSelected ? [mainSelected] : []}
      items={toMenuItems(mainItems)}
      onClick={({ key }) => {
        go(mainItems, key)
        setDrawerOpen(false)
      }}
    />
  )

  const adminMenu = (
    <Menu
      data-testid="admin-menu"
      mode="inline"
      selectedKeys={adminSelected ? [adminSelected] : []}
      items={toMenuItems(adminItems)}
      onClick={({ key }) => {
        go(adminItems, key)
        setAdminDrawerOpen(false)
      }}
    />
  )

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <span data-testid="user-menu-profile">{t('navigation.profile')}</span>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <span data-testid="user-menu-logout">{t('auth.logout')}</span>,
    },
  ]

  const onUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') logout()
    else if (key === 'profile') navigate('/profile')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <TopProgressBar />
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={232}
          className="main-sider"
          data-testid="main-sider"
        >
          <div className={collapsed ? 'app-logo app-logo--collapsed' : 'app-logo'} data-testid="app-logo">
            <img src="/favicon.svg" alt="" width={26} height={26} data-testid="app-logo-icon" />
            {!collapsed && t('common.appName')}
          </div>
          {sideMenu}
        </Sider>
      )}

      {isMobile && (
        <Drawer
          data-testid="mobile-menu-drawer"
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{ body: { padding: 0 } }}
          width={240}
        >
          {sideMenu}
        </Drawer>
      )}

      <Layout>
        <Header className="site-layout-header" data-testid="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
            <Button
              data-testid="menu-toggle-button"
              type="text"
              icon={isMobile ? <MenuOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => (isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed))}
            />
            {isMobile && <img src="/favicon.svg" alt={t('common.appName')} width={24} height={24} data-testid="header-logo" />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {!isMobile && <LanguageSwitcher />}
            <Dropdown menu={{ items: userMenuItems, onClick: onUserMenuClick }} placement="bottomRight">
              <Button data-testid="user-menu-button" type="text" icon={<UserOutlined />}>
                {screens.lg && <span data-testid="user-menu-name">{user?.name || user?.email}</span>}
              </Button>
            </Dropdown>
            {showAdminMenu && (
              <Button
                data-testid="admin-menu-toggle-button"
                type="text"
                icon={isMobile ? <MenuOutlined /> : rightCollapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                onClick={() => (isMobile ? setAdminDrawerOpen(true) : setRightCollapsed(!rightCollapsed))}
              />
            )}
          </div>
        </Header>

        <Content className="site-layout-content" data-testid="main-content">
          {/* Keyed by path: a page that crashed is replaced as soon as the user navigates elsewhere */}
          <ErrorBoundary key={location.pathname} fallback={(_, reset) => <CrashScreen onRetry={reset} />}>
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </Content>
      </Layout>

      {!isMobile && showAdminMenu && (
        <Sider
          data-testid="admin-sider"
          trigger={null}
          collapsible
          collapsed={rightCollapsed}
          reverseArrow
          className="admin-sider"
        >
          <div className="admin-sider-title">
            <CrownOutlined />
            {!rightCollapsed && t('navigation.adminMenu')}
          </div>
          {adminMenu}
        </Sider>
      )}

      {isMobile && showAdminMenu && (
        <Drawer
          data-testid="admin-menu-drawer"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CrownOutlined />
              {t('navigation.adminMenu')}
            </div>
          }
          placement="right"
          open={adminDrawerOpen}
          onClose={() => setAdminDrawerOpen(false)}
          styles={{ body: { padding: 0 } }}
          width={250}
        >
          {adminMenu}
        </Drawer>
      )}
    </Layout>
  )
}
