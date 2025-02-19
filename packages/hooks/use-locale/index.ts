import {
  computed,
  getCurrentInstance,
  inject,
  provide,
  ref,
} from 'vue'
import English from '@element-plus/locale/lang/en'

import type { InjectionKey, PropType, Ref } from 'vue'
import type { Language } from '@element-plus/locale'

export const useLocaleProps = {
  locale: {
    type: Object as PropType<Language>,
  },
  i18n: {
    type: Function as PropType<Translator>,
  },
}

type Translator = (...args: any[]) => string

export type LocaleContext = {
  locale: Ref<Language>
  lang: Ref<string>
  t: Translator
}

export const LocaleInjectionKey = 'ElLocaleInjection' as unknown as InjectionKey<LocaleContext>

export const useLocale = () => {
  const vm = getCurrentInstance()
  const props = vm.props as {
    locale: Language
    i18n: Translator
  }

  const locale = computed(() => props.locale || English)
  const lang = computed(() => locale.value.name)

  const _translator = (...args: any[]) => {
    const [path, option] = args
    let value
    const array = path.split('.')
    let current = locale.value
    for (let i = 0, j = array.length; i < j; i++) {
      const property = array[i]
      value = current[property]
      if (i === j - 1) return template(value, option)
      if (!value) return ''
      current = value
    }
  }

  const t = (...args: any[]) => {
    return props.i18n?.(...args) || _translator(...args)
  }

  provide(LocaleInjectionKey, {
    locale,
    lang,
    t,
  })
}


function template(str: string, option) {
  if (!str || !option) return str
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return option[key]
  })
}


export const useLocaleInject = () => {
  return inject(LocaleInjectionKey, {
    lang: ref(English.name),
    locale: ref(English),
    t: (...args) => {
      const [path, option] = args
      let value
      const array = path.split('.')
      let current = English
      for (let i = 0, j = array.length; i < j; i++) {
        const property = array[i]
        value = current[property]
        if (i === j - 1) return template(value, option)
        if (!value) return ''
        current = value
      }
    },
  })
}
