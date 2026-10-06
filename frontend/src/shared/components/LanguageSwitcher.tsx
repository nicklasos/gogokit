import { Select } from 'antd'
import { useTranslation } from 'react-i18next'
import { GlobalOutlined } from '@ant-design/icons'
import message from '@/shared/utils/message'

const { Option } = Select

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  const handleLanguageChange = async (lng: string) => {
    try {
      await i18n.changeLanguage(lng)
      localStorage.setItem('i18nextLng', lng)
      message.success(t('common.languageChanged'))
    } catch {
      message.error(t('errors.fallback'))
    }
  }

  return (
    <Select
      data-testid="language-switcher"
      value={i18n.language?.startsWith('uk') ? 'uk' : 'en'}
      onChange={handleLanguageChange}
      style={{ width: 120 }}
      suffixIcon={<GlobalOutlined />}
    >
      <Option value="en" data-testid="language-option-en">
        {t('common.english')}
      </Option>
      <Option value="uk" data-testid="language-option-uk">
        {t('common.ukrainian')}
      </Option>
    </Select>
  )
}
