import { TeamOutlined } from '@ant-design/icons'
import { ROLE_USER } from '@/auth/roles'
import { UserManagement } from '../components/UserManagement'

export default function UsersPage() {
  return <UserManagement role={ROLE_USER} icon={<TeamOutlined />} />
}
