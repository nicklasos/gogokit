import { CrownOutlined } from '@ant-design/icons'
import { ROLE_SUPER_ADMIN } from '@/auth/roles'
import { UserManagement } from '../components/UserManagement'

export default function SuperAdminsPage() {
  return <UserManagement role={ROLE_SUPER_ADMIN} icon={<CrownOutlined />} />
}
