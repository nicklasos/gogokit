import { SafetyCertificateOutlined } from '@ant-design/icons'
import { ROLE_ADMIN } from '@/auth/roles'
import { UserManagement } from '../components/UserManagement'

export default function AdminsPage() {
  return <UserManagement role={ROLE_ADMIN} icon={<SafetyCertificateOutlined />} />
}
